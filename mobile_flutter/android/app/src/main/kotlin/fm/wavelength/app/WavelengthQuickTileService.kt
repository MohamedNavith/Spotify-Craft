package fm.wavelength.app

import android.content.Context
import android.content.Intent
import android.os.Build
import android.service.quicksettings.Tile
import android.service.quicksettings.TileService
import android.view.KeyEvent
import androidx.annotation.RequiresApi
import com.ryanheise.audioservice.MediaButtonReceiver

@RequiresApi(Build.VERSION_CODES.N)
class WavelengthQuickTileService : TileService() {

    override fun onStartListening() {
        super.onStartListening()
        refreshTile()
    }

    override fun onClick() {
        super.onClick()
        val prefs = getSharedPreferences(WavelengthMediaWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        val hasTrack = !prefs.getString(WavelengthMediaWidgetProvider.KEY_TITLE, null).isNullOrBlank()
        if (!hasTrack) {
            val intent = Intent(this, MainActivity::class.java).apply {
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            startActivityAndCollapse(intent)
            return
        }
        val toggle = Intent(this, MediaButtonReceiver::class.java).apply {
            action = Intent.ACTION_MEDIA_BUTTON
            putExtra(Intent.EXTRA_KEY_EVENT, KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE))
        }
        sendBroadcast(toggle)
        val isPlaying = !prefs.getBoolean(WavelengthMediaWidgetProvider.KEY_IS_PLAYING, false)
        prefs.edit().putBoolean(WavelengthMediaWidgetProvider.KEY_IS_PLAYING, isPlaying).apply()
        refreshTile()
    }

    private fun refreshTile() {
        val tile = qsTile ?: return
        val prefs = getSharedPreferences(WavelengthMediaWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        val title = prefs.getString(WavelengthMediaWidgetProvider.KEY_TITLE, null)
        val isPlaying = prefs.getBoolean(WavelengthMediaWidgetProvider.KEY_IS_PLAYING, false)
        tile.label = if (!title.isNullOrBlank()) title else "Wavelength"
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            tile.subtitle = if (isPlaying) "Playing" else if (!title.isNullOrBlank()) "Paused" else "Open player"
        }
        tile.state = if (isPlaying) Tile.STATE_ACTIVE else Tile.STATE_INACTIVE
        tile.updateTile()
    }
}
