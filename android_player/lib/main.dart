import 'dart:async';

import 'music_library.dart';

import 'dart:convert';

import 'package:audio_service/audio_service.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'playback.dart';
import 'player_screen.dart';

const names = [
  "Today’s Top Hits",
  "Bollywood & Indian Hits",
  "Global Top 50",
  "Chill Lo-Fi Study",
  "Liked Songs",
  "Rock & Pop Legends",
];
const icons = [
  Icons.local_fire_department_outlined,
  Icons.auto_awesome_outlined,
  Icons.graphic_eq,
  Icons.headphones_outlined,
  Icons.favorite,
  Icons.music_note_outlined,
];
const colors = [
  0xff07885e,
  0xffed681a,
  0xff7832de,
  0xff007684,
  0xff593698,
  0xffb51e62,
];
const mint = Color(0xff76dfbd);
late Playback audio;
late SharedPreferences prefs;
final lists = <String, List<MediaItem>>{};
final songs = <String, MediaItem>{};
Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  audio = await AudioService.init(
    builder: Playback.new,
    config: const AudioServiceConfig(
      androidNotificationChannelId: 'fm.wavelength.reference.playback',
      androidNotificationChannelName: 'Music playback',
      androidNotificationOngoing: true,
    ),
  );
  await audio.initialize();
  prefs = await SharedPreferences.getInstance();
  final raw =
      jsonDecode(await rootBundle.loadString('assets/catalog.json')) as Map;
  for (final entry in raw.entries.indexed) {
    lists[names[entry.$1]] = [
      for (final t in entry.$2.value)
        MediaItem(
          id: t['id'],
          title: t['title'],
          artist: t['artistName'],
          album: t['albumName'],
          artUri: Uri.tryParse(t['artworkUrl']),
          extras: {'url': t['streamUrl']},
        ),
    ];
  }
  for (final l in lists.values) {
    for (final t in l) {
      songs[t.id] = t;
    }
  }
  for (final item in MusicLibrary.restore(prefs)) {
    songs[item.id] = item;
  }
  lists[names[5]] = [...lists[names[0]]!, ...lists[names[2]]!];
  for (final n in [
    names[4],
    ...prefs.getStringList('playlists') ?? <String>[],
  ]) {
    lists[n] = [
      for (final id in prefs.getStringList('list:$n') ?? <String>[])
        if (songs.containsKey(id)) songs[id]!,
    ];
  }
  runApp(const App());
}

class App extends StatelessWidget {
  const App({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    title: 'Wavelength',
    debugShowCheckedModeBanner: false,
    theme: ThemeData.dark(useMaterial3: true).copyWith(
      scaffoldBackgroundColor: const Color(0xff101010),
      colorScheme: ColorScheme.fromSeed(
        seedColor: mint,
        brightness: Brightness.dark,
      ),
    ),
    home: const Shell(),
  );
}

class Shell extends StatefulWidget {
  const Shell({super.key});
  @override
  State<Shell> createState() => _ShellState();
}

class _ShellState extends State<Shell> {
  int tab = 0;
  String filter = 'All', query = '';
  bool glow = true;
  Timer? debounce;
  List<MediaItem> remote = [];
  String catalogStatus = '';
  @override
  void dispose() {
    debounce?.cancel();
    super.dispose();
  }

  void search(String value) {
    debounce?.cancel();
    setState(() {
      query = value;
      remote = [];
      catalogStatus = '';
    });
    final term = value.trim();
    if (term.isEmpty) return;
    debounce = Timer(const Duration(milliseconds: 250), () async {
      try {
        final rows = await MusicLibrary.search(term);
        if (mounted && query == value) setState(() => remote = rows);
      } catch (_) {
        if (mounted && query == value)
          setState(
            () => catalogStatus =
                'Online catalog unavailable. Your library is still searchable.',
          );
      }
    });
  }

  Future<void> importAudio() async {
    try {
      final files = await MusicLibrary.pick();
      for (final item in files) {
        await MusicLibrary.remember(prefs, item);
        songs[item.id] = item;
      }
      if (mounted) setState(() {});
    } catch (_) {
      if (mounted)
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not read this audio file.')),
        );
    }
  }

  Future<void> open(String title, List<MediaItem> items) async {
    await Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => Scaffold(
          appBar: AppBar(title: Text(title)),
          body: items.isEmpty
              ? const Center(child: Text('No songs yet'))
              : ListView.builder(
                  itemCount: items.length,
                  itemBuilder: (c, i) => row(items, i),
                ),
        ),
      ),
    );
    if (mounted) setState(() {});
  }

  Widget row(List<MediaItem> items, int i) {
    final t = items[i];
    return ListTile(
      title: Text(t.title),
      subtitle: Text(t.artist ?? ''),
      leading: const Icon(Icons.audiotrack),
      onTap: () async {
        try {
          await audio.select(items, i);
        } catch (_) {
          if (mounted)
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(content: Text('Unable to play this recording.')),
            );
        }
      },
      trailing: IconButton(
        tooltip: 'Add to playlist',
        icon: const Icon(Icons.playlist_add),
        onPressed: () => add(t),
      ),
    );
  }

  Future<String?> create() async {
    String value = '';
    final n = await showDialog<String>(
      context: context,
      builder: (c) => AlertDialog(
        title: const Text('New playlist'),
        content: TextField(
          autofocus: true,
          onChanged: (s) => value = s,
          decoration: const InputDecoration(labelText: 'Playlist name'),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(c, value.trim()),
            child: const Text('Create'),
          ),
        ],
      ),
    );
    if (n == null || n.isEmpty || names.contains(n)) return null;
    lists.putIfAbsent(n, () => []);
    await prefs.setStringList(
      'playlists',
      lists.keys.where((k) => !names.contains(k)).toList(),
    );
    if (mounted) setState(() {});
    return n;
  }

  Future<void> add(MediaItem t) async {
    String? n = await showModalBottomSheet<String>(
      context: context,
      builder: (c) => SafeArea(
        child: ListView(
          shrinkWrap: true,
          children: [
            ListTile(
              title: const Text('New playlist'),
              leading: const Icon(Icons.add),
              onTap: () => Navigator.pop(c, ''),
            ),
            for (final k in [
              names[4],
              ...lists.keys.where((s) => !names.contains(s)),
            ])
              ListTile(
                title: Text(k),
                trailing: lists[k]!.contains(t)
                    ? const Icon(Icons.check)
                    : null,
                onTap: () => Navigator.pop(c, k),
              ),
          ],
        ),
      ),
    );
    if (n == '') n = await create();
    if (n == null) return;
    await MusicLibrary.remember(prefs, t);
    songs[t.id] = t;
    final tracks = lists[n]!;
    if (!tracks.contains(t)) tracks.add(t);
    await prefs.setStringList('list:$n', tracks.map((t) => t.id).toList());
    if (mounted) setState(() {});
  }

  Widget home() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: glow
              ? [const Color(0xff293e36), const Color(0xff161918)]
              : [const Color(0xff191919), const Color(0xff191919)],
        ),
      ),
      child: ListView(
        padding: const EdgeInsets.fromLTRB(24, 16, 24, 32),
        children: [
          Container(
            color: const Color(0xff171a19),
            padding: const EdgeInsets.symmetric(vertical: 6),
            child: Wrap(
              spacing: 6,
              children: [
                for (final f in ['All', 'Music', 'Podcasts'])
                  ActionChip(
                    label: Text(
                      f,
                      style: TextStyle(
                        color: f == filter ? Colors.black : Colors.white,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    backgroundColor: f == filter
                        ? Colors.white
                        : const Color(0xff222524),
                    shape: const StadiumBorder(),
                    side: BorderSide.none,
                    onPressed: () => setState(() => filter = f),
                  ),
              ],
            ),
          ),
          if (filter == 'Podcasts')
            const Padding(
              padding: EdgeInsets.only(top: 24),
              child: Text('No podcasts in your library'),
            )
          else ...[
            Padding(
              padding: const EdgeInsets.symmetric(vertical: 20),
              child: Text(
                DateTime.now().hour < 12
                    ? 'Good morning'
                    : DateTime.now().hour < 18
                    ? 'Good afternoon'
                    : 'Good evening',
                style: heading,
              ),
            ),
            GridView.builder(
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                mainAxisExtent: 50,
                crossAxisSpacing: 8,
                mainAxisSpacing: 8,
              ),
              itemCount: 6,
              itemBuilder: (c, i) => Material(
                color: Colors.white.withValues(alpha: .06),
                borderRadius: BorderRadius.circular(4),
                clipBehavior: Clip.antiAlias,
                child: InkWell(
                  onTap: () => open(names[i], lists[names[i]]!),
                  child: Row(
                    children: [
                      Container(
                        width: 42,
                        height: 50,
                        color: Color(colors[i]),
                        child: Icon(icons[i], color: Colors.white),
                      ),
                      Expanded(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 8),
                          child: Text(
                            names[i],
                            maxLines: 2,
                            overflow: TextOverflow.ellipsis,
                            style: const TextStyle(
                              fontSize: 13,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            const SizedBox(height: 48),
            Text('Made For You', style: heading),
            const Text(
              'A mix for each mood',
              style: TextStyle(color: Colors.white60, fontSize: 12),
            ),
            const SizedBox(height: 16),
            GridView.count(
              crossAxisCount: 2,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
              childAspectRatio: .73,
              shrinkWrap: true,
              physics: const NeverScrollableScrollPhysics(),
              children: [
                for (final (i, id) in [
                  'bruno-mars',
                  'arijit-singh',
                  'billie-eilish',
                  'the-weeknd',
                ].indexed)
                  InkWell(
                    onTap: () => open('Daily Mix ${i + 1}', lists[names[i]]!),
                    child: Container(
                      padding: const EdgeInsets.all(14),
                      decoration: BoxDecoration(
                        color: const Color(0xff191919),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          AspectRatio(
                            aspectRatio: 1,
                            child: ClipRRect(
                              borderRadius: BorderRadius.circular(8),
                              child: Stack(
                                fit: StackFit.expand,
                                children: [
                                  Image.asset(
                                    'assets/$id.webp',
                                    fit: BoxFit.cover,
                                    alignment: const Alignment(0, -.5),
                                  ),
                                  const Positioned(
                                    left: 8,
                                    top: 14,
                                    child: Text(
                                      'WAVELENGTH',
                                      style: TextStyle(
                                        fontSize: 9,
                                        fontWeight: FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            'Daily Mix ${i + 1}',
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                        ],
                      ),
                    ),
                  ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  TextStyle get heading => const TextStyle(
    fontSize: 23,
    fontWeight: FontWeight.w800,
    letterSpacing: -.8,
  );
  @override
  Widget build(BuildContext context) {
    final hits = songs.values
        .where(
          (t) => ('${t.title} ${t.artist}').toLowerCase().contains(
            query.toLowerCase(),
          ),
        )
        .toList();
    hits.addAll(remote.where((t) => !hits.any((h) => h.id == t.id)));
    return Scaffold(
      appBar: AppBar(
        toolbarHeight: 62,
        titleSpacing: 12,
        title: const Row(
          children: [
            CircleAvatar(
              radius: 17,
              backgroundColor: mint,
              child: Icon(Icons.sensors, color: Colors.black, size: 20),
            ),
            SizedBox(width: 10),
            Text(
              'Wavelength',
              style: TextStyle(fontSize: 17, fontWeight: FontWeight.w900),
            ),
          ],
        ),
        actions: [
          IconButton(
            tooltip: 'Toggle ambient background',
            onPressed: () => setState(() => glow = !glow),
            icon: Icon(Icons.toggle_on_outlined, color: glow ? mint : null),
          ),
          IconButton(
            tooltip: 'Settings',
            onPressed: () => setState(() => tab = 3),
            icon: const Icon(Icons.settings_outlined),
          ),
        ],
      ),
      body: Column(
        children: [
          Expanded(
            child: switch (tab) {
              0 => home(),
              1 => ListView(
                children: [
                  TextField(
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.search),
                      hintText: 'Search songs, artists and playlists',
                    ),
                    onChanged: search,
                  ),
                  for (final k in lists.keys.where(
                    (s) => s.toLowerCase().contains(query.toLowerCase()),
                  ))
                    ListTile(
                      leading: const Icon(Icons.queue_music),
                      title: Text(k),
                      onTap: () => open(k, lists[k]!),
                    ),
                  if (catalogStatus.isNotEmpty)
                    ListTile(subtitle: Text(catalogStatus)),
                  for (int i = 0; i < hits.length; i++) row(hits, i),
                ],
              ),
              2 => ListView(
                children: [
                  ListTile(
                    leading: const Icon(Icons.audio_file),
                    title: const Text('Import local audio'),
                    onTap: importAudio,
                  ),
                  ListTile(
                    leading: const Icon(Icons.folder),
                    title: const Text('Local audio'),
                    onTap: () => open(
                      'Local audio',
                      songs.values
                          .where((t) => t.id.startsWith('local:'))
                          .toList(),
                    ),
                  ),
                  ListTile(
                    title: const Text('New playlist'),
                    leading: const Icon(Icons.add),
                    onTap: create,
                  ),
                  for (final k in [
                    names[4],
                    ...lists.keys.where((s) => !names.contains(s)),
                  ])
                    ListTile(
                      title: Text(k),
                      subtitle: Text('${lists[k]!.length} songs'),
                      onTap: () => open(k, lists[k]!),
                    ),
                ],
              ),
              3 => ListView(
                children: [
                  SwitchListTile(
                    title: const Text('Ambient background'),
                    value: glow,
                    onChanged: (v) => setState(() => glow = v),
                  ),
                  const ListTile(
                    title: Text('Library storage'),
                    subtitle: Text('On this device'),
                  ),
                ],
              ),
              _ => StreamBuilder<MediaItem?>(
                stream: audio.mediaItem,
                builder: (c, s) => Center(
                  child: Text(s.data?.title ?? 'Play a song to open Verci'),
                ),
              ),
            },
          ),
          StreamBuilder<MediaItem?>(
            stream: audio.mediaItem,
            builder: (c, s) {
              final t = s.data;
              if (t == null) return const SizedBox.shrink();
              return ListTile(
                title: Text(t.title),
                subtitle: Text(t.artist ?? ''),
                onTap: () => Navigator.push(
                  context,
                  MaterialPageRoute(
                    builder: (_) => PlayerScreen(
                      player: audio,
                      onAdd: add,
                      onQueue: () => open('Queue', audio.queue.value),
                    ),
                  ),
                ),
                leading: IconButton(
                  icon: const Icon(Icons.playlist_add),
                  onPressed: () => add(t),
                ),
                trailing: StreamBuilder<PlaybackState>(
                  stream: audio.playbackState,
                  builder: (c, s) => IconButton(
                    icon: Icon(
                      s.data?.playing == true ? Icons.pause : Icons.play_arrow,
                    ),
                    onPressed: s.data?.playing == true
                        ? audio.pause
                        : audio.play,
                  ),
                ),
              );
            },
          ),
        ],
      ),
      bottomNavigationBar: BottomNavigationBar(
        type: BottomNavigationBarType.fixed,
        backgroundColor: const Color(0xff101010),
        selectedItemColor: mint,
        unselectedItemColor: Colors.white70,
        currentIndex: tab,
        onTap: (i) => setState(() => tab = i),
        items: const [
          BottomNavigationBarItem(
            icon: Icon(Icons.home_outlined),
            label: 'Home',
          ),
          BottomNavigationBarItem(icon: Icon(Icons.search), label: 'Search'),
          BottomNavigationBarItem(
            icon: Icon(Icons.library_music_outlined),
            label: 'Library',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.settings_outlined),
            label: 'Settings',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.radio_button_checked),
            label: 'Verci',
          ),
        ],
      ),
    );
  }
}
