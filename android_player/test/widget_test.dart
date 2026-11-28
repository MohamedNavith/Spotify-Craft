import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:wavelength_reference/main.dart';

void main(){
 TestWidgetsFlutterBinding.ensureInitialized();
 test('each reference shelf carries a playable preview and artist metadata',()async{
 final catalog=jsonDecode(await rootBundle.loadString('assets/catalog.json')) as Map;
 expect(catalog.keys,['todayTopHits','bollywoodHits','global50','chillLoFi']);
 for(final shelf in catalog.values){expect(shelf,isNotEmpty);for(final song in shelf){expect(Uri.parse(song['streamUrl']).scheme,'https');expect(song['artistName'],isNotEmpty);}}
 });
 test('quick links retain the six destinations and order in the APK',(){
 expect(names,['Today’s Top Hits','Bollywood & Indian Hits','Global Top 50','Chill Lo-Fi Study','Liked Songs','Rock & Pop Legends']);
 });
}
