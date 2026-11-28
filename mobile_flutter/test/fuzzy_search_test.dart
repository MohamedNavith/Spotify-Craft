import 'package:flutter_test/flutter_test.dart';
import 'package:wavelength_app/core/fuzzy_search.dart';
import 'package:wavelength_app/core/models.dart';

void main() {
  test('matches prefixes in Hindi and Tamil titles', () {
    expect(FuzzySearchEngine.similarityScore('अरि', 'अरिजीत सिंह'), greaterThan(0.9));
    expect(FuzzySearchEngine.similarityScore('அனி', 'அனிருத்'), greaterThan(0.9));
  });
  const sampleTracks = [
    WavelengthTrack(
      id: '1',
      title: 'Tum Hi Ho',
      artist: 'Arijit Singh & Mithoon',
      album: 'Aashiqui 2',
    ),
    WavelengthTrack(
      id: '2',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
    ),
    WavelengthTrack(
      id: '3',
      title: 'BIRDS OF A FEATHER',
      artist: 'Billie Eilish',
      album: 'HIT ME HARD AND SOFT',
    ),
    WavelengthTrack(
      id: '4',
      title: 'Kesariya',
      artist: 'Pritam & Arijit Singh',
      album: 'Brahmastra',
    ),
  ];

  group('FuzzySearchEngine', () {
    test('handles swapped, missing, and extra letters across artist and title', () {
      // Missing letter: arjit -> Arijit
      final arijitHits = FuzzySearchEngine.searchTracks('arjit sing', sampleTracks);
      expect(arijitHits, isNotEmpty);
      expect(arijitHits.any((t) => t.artist.contains('Arijit')), isTrue);

      // Swapped + extra letters: wekeend blinding litghs
      final weekndHits = FuzzySearchEngine.searchTracks('blinding ligths', sampleTracks);
      expect(weekndHits.first.title, 'Blinding Lights');

      // Case, punctuation, extra whitespace
      final billieHits = FuzzySearchEngine.searchTracks('  birds   of a fether  ', sampleTracks);
      expect(billieHits.first.artist, 'Billie Eilish');
    });

    test('suggests Did You Mean candidate for near misses', () {
      final suggestion = FuzzySearchEngine.suggestDidYouMean(
        'arjit sing',
        ['Arijit Singh', 'The Weeknd', 'Billie Eilish', 'Kesariya'],
      );
      expect(suggestion, 'Arijit Singh');
    });

    test('computes Damerau-Levenshtein distance with transpositions accurately', () {
      expect(FuzzySearchEngine.damerauLevenshtein('starboy', 'staroby'), 1);
      expect(FuzzySearchEngine.damerauLevenshtein('arijit', 'arjit'), 1);
      expect(FuzzySearchEngine.damerauLevenshtein('weekend', 'weeknd'), 1);
    });
  });
}
