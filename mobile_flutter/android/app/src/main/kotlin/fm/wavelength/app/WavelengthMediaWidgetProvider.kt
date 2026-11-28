package fm.wavelength.app

import android.app.PendingIntent
import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.graphics.BitmapFactory
import android.os.Build
import android.view.KeyEvent
import android.widget.RemoteViews
import com.ryanheise.audioservice.MediaButtonReceiver
import java.io.File

class WavelengthMediaWidgetProvider : AppWidgetProvider() {

    override fun onUpdate(
        context: Context,
        appWidgetManager: AppWidgetManager,
        appWidgetIds: IntArray
    ) {
        for (appWidgetId in appWidgetIds) {
            updateWidget(context, appWidgetManager, appWidgetId)
        }
    }

    override fun onReceive(context: Context, intent: Intent) {
        super.onReceive(context, intent)
        if (intent.action == ACTION_WIDGET_COMMAND) {
            val keyCode = intent.getIntExtra(EXTRA_KEY_CODE, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE)
            val mediaIntent = Intent(context, MediaButtonReceiver::class.java).apply {
                action = Intent.ACTION_MEDIA_BUTTON
                putExtra(Intent.EXTRA_KEY_EVENT, KeyEvent(KeyEvent.ACTION_DOWN, keyCode))
            }
            context.sendBroadcast(mediaIntent)
        }
    }

    companion object {
        const val PREFS_NAME = "wavelength_widget_prefs"
        const val KEY_TITLE = "widget_title"
        const val KEY_ARTIST = "widget_artist"
        const val KEY_IS_PLAYING = "widget_is_playing"
        const val KEY_ART_PATH = "widget_art_path"
        private const val ACTION_WIDGET_COMMAND = "fm.wavelength.app.WIDGET_ACTION"
        private const val EXTRA_KEY_CODE = "key_code"

        fun updateAll(context: Context) {
            val manager = AppWidgetManager.getInstance(context)
            val component = ComponentName(context, WavelengthMediaWidgetProvider::class.java)
            val ids = manager.getAppWidgetIds(component)
            for (id in ids) {
                updateWidget(context, manager, id)
            }
        }

        private fun mediaButtonPendingIntent(
            context: Context,
            requestCode: Int,
            keyCode: Int
        ): PendingIntent {
            val intent = Intent(context, WavelengthMediaWidgetProvider::class.java).apply {
                action = ACTION_WIDGET_COMMAND
                putExtra(EXTRA_KEY_CODE, keyCode)
            }
            var flags = PendingIntent.FLAG_UPDATE_CURRENT
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags = flags or PendingIntent.FLAG_IMMUTABLE
            }
            return PendingIntent.getBroadcast(context, requestCode, intent, flags)
        }

        private fun launchAppPendingIntent(context: Context): PendingIntent {
            val launch = Intent(context, MainActivity::class.java).apply {
                action = Intent.ACTION_VIEW
                data = android.net.Uri.parse("wavelength://player")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_SINGLE_TOP
            }
            var flags = PendingIntent.FLAG_UPDATE_CURRENT
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                flags = flags or PendingIntent.FLAG_IMMUTABLE
            }
            return PendingIntent.getActivity(context, 4001, launch, flags)
        }

        private fun updateWidget(
            context: Context,
            appWidgetManager: AppWidgetManager,
            appWidgetId: Int
        ) {
            val prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE)
            val title = prefs.getString(KEY_TITLE, "Wavelength") ?: "Wavelength"
            val artist = prefs.getString(KEY_ARTIST, "Tap to start listening") ?: "Tap to start listening"
            val isPlaying = prefs.getBoolean(KEY_IS_PLAYING, false)
            val artPath = prefs.getString(KEY_ART_PATH, null)

            val views = RemoteViews(context.packageName, R.layout.wavelength_widget)
            views.setTextViewText(R.id.widget_title, title)
            views.setTextViewText(R.id.widget_artist, artist)
            views.setImageViewResource(
                R.id.widget_play_pause,
                if (isPlaying) R.drawable.ic_pause_media else R.drawable.ic_play_media
            )

            var artSet = false
            if (!artPath.isNullOrBlank()) {
                val file = File(artPath)
                if (file.exists()) {
                    val bmp = BitmapFactory.decodeFile(file.absolutePath)
                    if (bmp != null) {
                        views.setImageViewBitmap(R.id.widget_art, bmp)
                        artSet = true
                    }
                }
            }
            if (!artSet) {
                views.setImageViewResource(R.id.widget_art, R.mipmap.ic_launcher)
            }

            views.setOnClickPendingIntent(R.id.widget_root, launchAppPendingIntent(context))
            views.setOnClickPendingIntent(
                R.id.widget_prev,
                mediaButtonPendingIntent(context, 4101, KeyEvent.KEYCODE_MEDIA_PREVIOUS)
            )
            views.setOnClickPendingIntent(
                R.id.widget_play_pause,
                mediaButtonPendingIntent(context, 4102, KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE)
            )
            views.setOnClickPendingIntent(
                R.id.widget_next,
                mediaButtonPendingIntent(context, 4103, KeyEvent.KEYCODE_MEDIA_NEXT)
            )

            appWidgetManager.updateAppWidget(appWidgetId, views)
        }
    }
}
