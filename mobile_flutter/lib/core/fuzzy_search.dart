import 'dart:math' as math;
import 'models.dart';

class FuzzySearchEngine {
  static const Map<String, String> _diacriticMap = {
    'à': 'a', 'á': 'a', 'â': 'a', 'ã': 'a', 'ä': 'a', 'å': 'a',
    'è': 'e', 'é': 'e', 'ê': 'e', 'ë': 'e',
    'ì': 'i', 'í': 'i', 'î': 'i', 'ï': 'i',
    'ò': 'o', 'ó': 'o', 'ô': 'o', 'õ': 'o', 'ö': 'o',
    'ù': 'u', 'ú': 'u', 'û': 'u', 'ü': 'u',
    'ñ': 'n', 'ç': 'c', 'ÿ': 'y',
  };

  /// Normalizes strings for typo-tolerant search (case, accents, whitespace, punctuation).
  static String normalize(String input) {
    final buf = StringBuffer();
    final lower = input.toLowerCase();
    for (final rune in lower.runes) {
      final ch = String.fromCharCode(rune);
      final mapped = _diacriticMap[ch] ?? ch;
      final code = mapped.codeUnitAt(0);
      final isAlnum =
          (code >= 97 && code <= 122) || (code >= 48 && code <= 57);
      if (isAlnum) {
        buf.write(mapped);
      } else {
        buf.write(' ');
      }
    }
    return buf.toString().trim().replaceAll(RegExp(r'\s+'), ' ');
  }

  /// Phonetic normalization covering common transliterations (e.g. ph->f, ee->i, oo->u, doubled letters).
  static String phoneticKey(String input) {
    var s = normalize(input)
        .replaceAll('ph', 'f')
        .replaceAll('ck', 'k')
        .replaceAll('qu', 'k')
        .replaceAll('ee', 'i')
        .replaceAll('oo', 'u')
        .replaceAll('aa', 'a')
        .replaceAll('z', 's')
        .replaceAll('w', 'v');
    s = s.replaceAllMapped(RegExp(r'([a-z0-9])\1+'), (m) => m.group(1)!);
    return s;
  }

  /// Optimal string alignment / Damerau-Levenshtein supporting adjacent transpositions.
  static int damerauLevenshtein(String a, String b) {
    final n = a.length;
    final m = b.length;
    if (n == 0) return m;
    if (m == 0) return n;

    final d = List.generate(n + 1, (_) => List<int>.filled(m + 1, 0));
    for (var i = 0; i <= n; i++) {
      d[i][0] = i;
    }
    for (var j = 0; j <= m; j++) {
      d[0][j] = j;
    }

    for (var i = 1; i <= n; i++) {
      for (var j = 1; j <= m; j++) {
        final cost = a.codeUnitAt(i - 1) == b.codeUnitAt(j - 1) ? 0 : 1;
        var val = math.min(
          d[i - 1][j] + 1,
          math.min(d[i][j - 1] + 1, d[i - 1][j - 1] + cost),
        );
        if (i > 1 &&
            j > 1 &&
            a.codeUnitAt(i - 1) == b.codeUnitAt(j - 2) &&
            a.codeUnitAt(i - 2) == b.codeUnitAt(j - 1)) {
          val = math.min(val, d[i - 2][j - 2] + 1);
        }
        d[i][j] = val;
      }
    }
    return d[n][m];
  }

  /// Returns a similarity score in `[0.0, 1.0]` between a query and candidate string.
  static double similarityScore(String rawQuery, String rawTarget) {
    final q = normalize(rawQuery);
    final t = normalize(rawTarget);
    if (q.isEmpty || t.isEmpty) return 0.0;
    if (t == q) return 1.0;
    if (t.startsWith(q)) return 0.94;
    if (t.contains(q)) return 0.86;

    final compactQ = q.replaceAll(' ', '');
    final compactT = t.replaceAll(' ', '');
    if (compactT == compactQ) return 0.96;
    if (compactT.startsWith(compactQ)) return 0.89;
    if (compactT.contains(compactQ)) return 0.82;

    final qTokens = q.split(' ').where((w) => w.isNotEmpty).toList();
    final tTokens = t.split(' ').where((w) => w.isNotEmpty).toList();
    if (qTokens.isEmpty || tTokens.isEmpty) return 0.0;

    var matchedWeight = 0.0;
    for (final qt in qTokens) {
      var bestTokenScore = 0.0;
      for (final tt in tTokens) {
        if (tt == qt) {
          bestTokenScore = 1.0;
          break;
        }
        if (tt.startsWith(qt)) {
          bestTokenScore = math.max(bestTokenScore, 0.9);
          continue;
        }
        if (tt.contains(qt) && qt.length >= 3) {
          bestTokenScore = math.max(bestTokenScore, 0.82);
          continue;
        }
        final pq = phoneticKey(qt);
        final pt = phoneticKey(tt);
        if (pq == pt) {
          bestTokenScore = math.max(bestTokenScore, 0.85);
          continue;
        }
        final dist = damerauLevenshtein(qt, tt);
        final maxLen = math.max(qt.length, tt.length);
        final allowedDist = maxLen <= 3 ? 1 : (maxLen <= 6 ? 2 : 3);
        if (dist <= allowedDist) {
          final s = 1.0 - (dist / (maxLen + 0.5));
          bestTokenScore = math.max(bestTokenScore, s * 0.88);
        } else {
          final pDist = damerauLevenshtein(pq, pt);
          if (pDist <= 1 && pq.length >= 3) {
            bestTokenScore = math.max(bestTokenScore, 0.72);
          }
        }
      }
      matchedWeight += bestTokenScore;
    }

    final tokenAvg = matchedWeight / qTokens.length;
    final wholeDist = damerauLevenshtein(compactQ, compactT);
    final wholeMax = math.max(compactQ.length, compactT.length);
    final wholeScore =
        wholeMax > 0 ? math.max(0.0, 1.0 - (wholeDist / wholeMax)) : 0.0;

    return math.max(tokenAvg, wholeScore * 0.92);
  }

  static double scoreTrack(String query, WavelengthTrack track) {
    final titleScore = similarityScore(query, track.title) * 1.15;
    final artistScore = similarityScore(query, track.artist);
    final albumScore = similarityScore(query, track.album) * 0.75;
    final combinedScore =
        similarityScore(query, '${track.title} ${track.artist}');
    return math.max(
      math.max(titleScore, combinedScore),
      math.max(artistScore, albumScore),
    ).clamp(0.0, 1.15);
  }

  static List<WavelengthTrack> searchTracks(
    String query,
    Iterable<WavelengthTrack> tracks, {
    double minScore = 0.42,
    int limit = 50,
  }) {
    final q = normalize(query);
    if (q.isEmpty) return const [];
    final scored = <({WavelengthTrack track, double score})>[];
    final seenKeys = <String>{};
    for (final t in tracks) {
      final key = '${normalize(t.title)}::${normalize(t.artist)}';
      if (seenKeys.contains(key)) continue;
      final score = scoreTrack(q, t);
      if (score >= minScore) {
        seenKeys.add(key);
        scored.add((track: t, score: score));
      }
    }
    scored.sort((a, b) => b.score.compareTo(a.score));
    return scored.take(limit).map((e) => e.track).toList();
  }

  /// Suggests a cleaner query term ("Did you mean ...") when the user mistyped.
  static String? suggestDidYouMean(
    String rawQuery,
    Iterable<String> vocabulary,
  ) {
    final q = normalize(rawQuery);
    if (q.length < 3) return null;

    String? bestCandidate;
    var bestScore = 0.0;
    for (final item in vocabulary) {
      final normItem = normalize(item);
      if (normItem.isEmpty || normItem == q) continue;
      final s = similarityScore(q, normItem);
      if (s > bestScore && s >= 0.56 && s < 0.98) {
        bestScore = s;
        bestCandidate = item;
      }
    }
    return bestCandidate;
  }
}
