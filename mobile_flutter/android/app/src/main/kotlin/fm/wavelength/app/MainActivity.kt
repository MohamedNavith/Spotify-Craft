package fm.wavelength.app

import android.content.ComponentName
import android.content.ContentValues
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.media.AudioDeviceCallback
import android.media.AudioDeviceInfo
import android.media.AudioManager
import android.media.audiofx.BassBoost
import android.media.audiofx.Equalizer
import android.media.audiofx.LoudnessEnhancer
import android.net.Uri
import android.os.Build
import android.os.Bundle
import android.os.Environment
import android.os.Handler
import android.os.Looper
import android.provider.MediaStore
import android.provider.Settings
import android.service.quicksettings.TileService
import androidx.core.content.FileProvider
import com.ryanheise.audioservice.AudioServiceFragmentActivity
import io.flutter.embedding.engine.FlutterEngine
import io.flutter.plugin.common.EventChannel
import io.flutter.plugin.common.MethodCall
import io.flutter.plugin.common.MethodChannel
import java.io.File
import java.io.FileInputStream
import java.util.concurrent.Executors

class MainActivity : AudioServiceFragmentActivity() {

    private var equalizer: Equalizer? = null
    private var bassBoost: BassBoost? = null
    private var loudnessEnhancer: LoudnessEnhancer? = null
    private var boundSessionId: Int = 0

    private var deepLinkSink: EventChannel.EventSink? = null
    private var audioDeviceSink: EventChannel.EventSink? = null
    private var initialDeepLink: String? = null
    private var audioDeviceCallback: AudioDeviceCallback? = null

    private val videoExecutor = Executors.newSingleThreadExecutor()
    private val mainHandler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        initialDeepLink = extractLinkPayload(intent)
    }

    override fun onNewIntent(intent: Intent) {
        super.onNewIntent(intent)
        setIntent(intent)
        val payload = extractLinkPayload(intent)
        if (!payload.isNullOrBlank()) {
            initialDeepLink = payload
            deepLinkSink?.success(payload)
        }
    }

    override fun configureFlutterEngine(flutterEngine: FlutterEngine) {
        super.configureFlutterEngine(flutterEngine)

        MethodChannel(flutterEngine.dartExecutor.binaryMessenger, "fm.wavelength.app/native")
            .setMethodCallHandler { call, result ->
                handleNativeMethod(call, result)
            }

        EventChannel(flutterEngine.dartExecutor.binaryMessenger, "fm.wavelength.app/deep_links")
            .setStreamHandler(object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    deepLinkSink = events
                    val link = initialDeepLink
                    if (!link.isNullOrBlank()) {
                        initialDeepLink = null
                        events?.success(link)
                    }
                }

                override fun onCancel(arguments: Any?) {
                    deepLinkSink = null
                }
            })

        EventChannel(flutterEngine.dartExecutor.binaryMessenger, "fm.wavelength.app/audio_devices")
            .setStreamHandler(object : EventChannel.StreamHandler {
                override fun onListen(arguments: Any?, events: EventChannel.EventSink?) {
                    audioDeviceSink = events
                    registerAudioDeviceListener()
                    events?.success(queryAudioOutputDevice())
                }

                override fun onCancel(arguments: Any?) {
                    unregisterAudioDeviceListener()
                    audioDeviceSink = null
                }
            })
    }

    override fun onDestroy() {
        unregisterAudioDeviceListener()
        releaseAudioEffects()
        videoExecutor.shutdownNow()
        super.onDestroy()
    }

    private fun extractLinkPayload(intent: Intent?): String? {
        if (intent == null) return null
        val action = intent.action ?: return null
        if (action == Intent.ACTION_VIEW) {
            return intent.dataString
        }
        if (action == Intent.ACTION_SEND && intent.type == "text/plain") {
            return intent.getStringExtra(Intent.EXTRA_TEXT)
        }
        return null
    }

    private fun handleNativeMethod(call: MethodCall, result: MethodChannel.Result) {
        when (call.method) {
            "getInitialDeepLink" -> {
                val link = initialDeepLink
                initialDeepLink = null
                result.success(link)
            }
            "initAudioEffects" -> {
                val sessionId = call.argument<Int>("sessionId") ?: 0
                result.success(initAudioEffects(sessionId))
            }
            "setEqualizerEnabled" -> {
                val enabled = call.argument<Boolean>("enabled") ?: false
                try {
                    equalizer?.enabled = enabled
                    bassBoost?.enabled = enabled
                    result.success(true)
                } catch (t: Throwable) {
                    result.success(false)
                }
            }
            "setEqualizerBand" -> {
                val band = call.argument<Int>("band") ?: 0
                val gainMb = call.argument<Int>("gainMb") ?: 0
                try {
                    val eq = equalizer
                    if (eq != null && band >= 0 && band < eq.numberOfBands.toInt()) {
                        val range = eq.bandLevelRange
                        val clamped = gainMb.coerceIn(range[0].toInt(), range[1].toInt())
                        eq.setBandLevel(band.toShort(), clamped.toShort())
                        result.success(true)
                    } else {
                        result.success(false)
                    }
                } catch (_: Throwable) {
                    result.success(false)
                }
            }
            "setBassBoost" -> {
                val strength = (call.argument<Int>("strength") ?: 0).coerceIn(0, 1000)
                try {
                    val bb = bassBoost
                    if (bb != null && bb.strengthSupported) {
                        bb.enabled = strength > 0
                        bb.setStrength(strength.toShort())
                        result.success(true)
                    } else {
                        result.success(false)
                    }
                } catch (_: Throwable) {
                    result.success(false)
                }
            }
            "setLoudnessGain" -> {
                val gainMb = (call.argument<Int>("gainMb") ?: 0).coerceIn(0, 1500)
                try {
                    val le = loudnessEnhancer
                    if (le != null) {
                        le.enabled = gainMb > 0
                        le.setTargetGain(gainMb)
                        result.success(true)
                    } else {
                        result.success(false)
                    }
                } catch (_: Throwable) {
                    result.success(false)
                }
            }
            "getAudioOutputDevice" -> {
                result.success(queryAudioOutputDevice())
            }
            "getInstalledShareApps" -> {
                result.success(queryInstalledShareApps())
            }
            "shareToInstagramStory" -> {
                val bgPath = call.argument<String>("backgroundPath")
                val stickerPath = call.argument<String>("stickerPath")
                val topColor = call.argument<String>("topColor") ?: "#121212"
                val bottomColor = call.argument<String>("bottomColor") ?: "#1DB954"
                val metaAppId = call.argument<String>("metaAppId") ?: ""
                val attributionUrl = call.argument<String>("attributionUrl") ?: ""
                result.success(
                    shareToInstagramStory(
                        bgPath,
                        stickerPath,
                        topColor,
                        bottomColor,
                        metaAppId,
                        attributionUrl
                    )
                )
            }
            "shareToSnapchat" -> {
                val filePath = call.argument<String>("filePath")
                val mimeType = call.argument<String>("mimeType") ?: "image/png"
                val caption = call.argument<String>("caption") ?: ""
                val snapClientId = call.argument<String>("snapClientId") ?: ""
                result.success(shareToSnapchat(filePath, mimeType, caption, snapClientId))
            }
            "shareMediaToPackage" -> {
                val packageName = call.argument<String>("packageName")
                val filePath = call.argument<String>("filePath")
                val mimeType = call.argument<String>("mimeType") ?: "image/png"
                val text = call.argument<String>("text")
                result.success(shareMediaToPackage(packageName, filePath, mimeType, text))
            }
            "saveImageToGallery" -> {
                val filePath = call.argument<String>("filePath")
                val displayName = call.argument<String>("displayName") ?: "wavelength_story.png"
                if (filePath.isNullOrBlank()) {
                    result.error("INVALID_ARGS", "Missing filePath", null)
                } else {
                    result.success(saveImageToGallery(filePath, displayName))
                }
            }
            "renderWaveformVideo" -> {
                val artPath = call.argument<String>("artworkPath")
                val title = call.argument<String>("title") ?: "Wavelength"
                val artist = call.argument<String>("artist") ?: "Artist"
                val accentColor = call.argument<Number>("accentColor")?.toInt() ?: 0xFF1DB954.toInt()
                val durationSec = call.argument<Int>("durationSeconds") ?: 15
                val outputPath = call.argument<String>("outputPath")
                if (outputPath.isNullOrBlank()) {
                    result.error("INVALID_ARGS", "Missing outputPath", null)
                } else {
                    videoExecutor.execute {
                        try {
                            val path = WaveformVideoExporter.exportStoryClip(
                                artPath,
                                title,
                                artist,
                                accentColor,
                                durationSec,
                                outputPath
                            )
                            mainHandler.post { result.success(path) }
                        } catch (t: Throwable) {
                            mainHandler.post {
                                result.error("VIDEO_EXPORT_FAILED", t.message ?: "Video export failed", null)
                            }
                        }
                    }
                }
            }
            "updateWidgetState" -> {
                val title = call.argument<String>("title") ?: "Wavelength"
                val artist = call.argument<String>("artist") ?: "Tap to listen"
                val isPlaying = call.argument<Boolean>("isPlaying") ?: false
                val artPath = call.argument<String>("artPath")
                updateWidgetAndTileState(title, artist, isPlaying, artPath)
                result.success(true)
            }
            "openBatteryOptimizationSettings" -> {
                result.success(openBatteryOptimizationSettings())
            }
            else -> result.notImplemented()
        }
    }

    private fun initAudioEffects(sessionId: Int): Map<String, Any> {
        if (sessionId <= 0) {
            return mapOf("initialized" to false, "bandCount" to 0)
        }
        if (sessionId != boundSessionId) {
            releaseAudioEffects()
            boundSessionId = sessionId
        }
        return try {
            if (equalizer == null) {
                equalizer = Equalizer(0, sessionId)
            }
            if (bassBoost == null) {
                bassBoost = BassBoost(0, sessionId)
            }
            if (loudnessEnhancer == null) {
                loudnessEnhancer = LoudnessEnhancer(sessionId)
            }
            val eq = equalizer!!
            val range = eq.bandLevelRange
            val bands = eq.numberOfBands.toInt()
            val freqs = (0 until bands).map { eq.getCenterFreq(it.toShort()) / 1000 }
            mapOf(
                "initialized" to true,
                "bandCount" to bands,
                "minMb" to range[0].toInt(),
                "maxMb" to range[1].toInt(),
                "centerFreqsHz" to freqs,
                "bassSupported" to (bassBoost?.strengthSupported ?: false)
            )
        } catch (t: Throwable) {
            mapOf("initialized" to false, "error" to (t.message ?: "Effect init failed"))
        }
    }

    private fun releaseAudioEffects() {
        try {
            equalizer?.release()
        } catch (_: Throwable) {}
        try {
            bassBoost?.release()
        } catch (_: Throwable) {}
        try {
            loudnessEnhancer?.release()
        } catch (_: Throwable) {}
        equalizer = null
        bassBoost = null
        loudnessEnhancer = null
        boundSessionId = 0
    }

    private fun registerAudioDeviceListener() {
        if (audioDeviceCallback != null) return
        val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val cb = object : AudioDeviceCallback() {
            override fun onAudioDevicesAdded(addedDevices: Array<out AudioDeviceInfo>?) {
                audioDeviceSink?.success(queryAudioOutputDevice())
            }

            override fun onAudioDevicesRemoved(removedDevices: Array<out AudioDeviceInfo>?) {
                audioDeviceSink?.success(queryAudioOutputDevice())
            }
        }
        audioDeviceCallback = cb
        audioManager.registerAudioDeviceCallback(cb, mainHandler)
    }

    private fun unregisterAudioDeviceListener() {
        val cb = audioDeviceCallback ?: return
        val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        audioManager.unregisterAudioDeviceCallback(cb)
        audioDeviceCallback = null
    }

    private fun queryAudioOutputDevice(): Map<String, Any> {
        val audioManager = getSystemService(Context.AUDIO_SERVICE) as AudioManager
        val outputs = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS)

        fun priority(type: Int): Int {
            return when (type) {
                AudioDeviceInfo.TYPE_USB_DEVICE, AudioDeviceInfo.TYPE_USB_HEADSET -> 100
                AudioDeviceInfo.TYPE_WIRED_HEADSET, AudioDeviceInfo.TYPE_WIRED_HEADPHONES -> 80
                AudioDeviceInfo.TYPE_BLE_HEADSET, AudioDeviceInfo.TYPE_BLE_SPEAKER -> 70
                AudioDeviceInfo.TYPE_BLUETOOTH_A2DP, AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> 60
                AudioDeviceInfo.TYPE_HDMI, AudioDeviceInfo.TYPE_LINE_DIGITAL -> 50
                AudioDeviceInfo.TYPE_BUILTIN_SPEAKER -> 10
                else -> 5
            }
        }

        val chosen = outputs.maxByOrNull { priority(it.type) }
        val route = when (chosen?.type) {
            AudioDeviceInfo.TYPE_USB_DEVICE, AudioDeviceInfo.TYPE_USB_HEADSET -> "usb_dac"
            AudioDeviceInfo.TYPE_WIRED_HEADSET, AudioDeviceInfo.TYPE_WIRED_HEADPHONES -> "wired"
            AudioDeviceInfo.TYPE_BLE_HEADSET, AudioDeviceInfo.TYPE_BLE_SPEAKER -> "bluetooth_le"
            AudioDeviceInfo.TYPE_BLUETOOTH_A2DP, AudioDeviceInfo.TYPE_BLUETOOTH_SCO -> "bluetooth_a2dp"
            else -> "speaker"
        }
        val productName = try {
            val raw = chosen?.productName?.toString()?.trim()
            if (!raw.isNullOrBlank()) raw else when (route) {
                "usb_dac" -> "USB-C Audio DAC"
                "wired" -> "Wired Headphones"
                "bluetooth_le", "bluetooth_a2dp" -> "Bluetooth Audio"
                else -> "Phone Speaker"
            }
        } catch (_: Throwable) {
            "Phone Audio"
        }

        val sampleRates = chosen?.sampleRates?.toList()?.filter { it > 0 } ?: emptyList()
        val maxSampleRate = sampleRates.maxOrNull() ?: 48000
        val isExternalDac = route == "usb_dac" || maxSampleRate >= 96000
        val isLosslessCapable = route == "usb_dac" || route == "wired" || route == "bluetooth_le"

        return mapOf(
            "route" to route,
            "name" to productName,
            "sampleRates" to sampleRates,
            "maxSampleRateHz" to maxSampleRate,
            "isExternalDac" to isExternalDac,
            "isLosslessCapable" to isLosslessCapable
        )
    }

    private fun isPackageInstalled(pkg: String): Boolean {
        return try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                packageManager.getPackageInfo(pkg, PackageManager.PackageInfoFlags.of(0))
            } else {
                @Suppress("DEPRECATION")
                packageManager.getPackageInfo(pkg, 0)
            }
            true
        } catch (_: Throwable) {
            false
        }
    }

    private fun queryInstalledShareApps(): Map<String, Boolean> {
        return mapOf(
            "instagram" to isPackageInstalled("com.instagram.android"),
            "snapchat" to isPackageInstalled("com.snapchat.android"),
            "whatsapp" to (isPackageInstalled("com.whatsapp") || isPackageInstalled("com.whatsapp.w4b")),
            "facebook" to isPackageInstalled("com.facebook.katana"),
            "telegram" to isPackageInstalled("org.telegram.messenger"),
            "x" to isPackageInstalled("com.twitter.android")
        )
    }

    private fun contentUriForPath(path: String): Uri {
        val file = File(path)
        return FileProvider.getUriForFile(this, "${packageName}.fileprovider", file)
    }

    private fun shareToInstagramStory(
        backgroundPath: String?,
        stickerPath: String?,
        topColor: String,
        bottomColor: String,
        metaAppId: String,
        attributionUrl: String
    ): Map<String, Any> {
        if (!isPackageInstalled("com.instagram.android")) {
            return mapOf("launched" to false, "reason" to "instagram_not_installed")
        }
        val bgUri = backgroundPath?.takeIf { it.isNotBlank() }?.let { contentUriForPath(it) }
        val stickerUri = stickerPath?.takeIf { it.isNotBlank() }?.let { contentUriForPath(it) }
        val mime = if (backgroundPath?.endsWith(".mp4", ignoreCase = true) == true) {
            "video/mp4"
        } else {
            "image/png"
        }

        if (metaAppId.isNotBlank()) {
            val intent = Intent("com.instagram.share.ADD_TO_STORY").apply {
                type = mime
                putExtra("source_application", metaAppId)
                putExtra("top_background_color", topColor)
                putExtra("bottom_background_color", bottomColor)
                if (attributionUrl.isNotBlank()) {
                    putExtra("content_url", attributionUrl)
                }
                if (bgUri != null) {
                    setDataAndType(bgUri, mime)
                    grantUriPermission(
                        "com.instagram.android",
                        bgUri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                    )
                }
                if (stickerUri != null) {
                    putExtra("interactive_asset_uri", stickerUri)
                    grantUriPermission(
                        "com.instagram.android",
                        stickerUri,
                        Intent.FLAG_GRANT_READ_URI_PERMISSION
                    )
                }
                flags = Intent.FLAG_GRANT_READ_URI_PERMISSION or Intent.FLAG_ACTIVITY_NEW_TASK
            }
            if (intent.resolveActivity(packageManager) != null) {
                startActivity(intent)
                return mapOf("launched" to true, "mode" to "instagram_stories_intent")
            }
        }

        // Honest direct-media fallback if Meta App ID is not configured yet
        val fallbackUri = bgUri ?: stickerUri
        val fallback = Intent(Intent.ACTION_SEND).apply {
            type = mime
            setPackage("com.instagram.android")
            if (fallbackUri != null) {
                putExtra(Intent.EXTRA_STREAM, fallbackUri)
            }
            if (attributionUrl.isNotBlank()) {
                putExtra(Intent.EXTRA_TEXT, attributionUrl)
            }
            addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
        }
        return try {
            startActivity(fallback)
            mapOf(
                "launched" to true,
                "mode" to "direct_send_fallback",
                "needsMetaAppId" to metaAppId.isBlank()
            )
        } catch (t: Throwable) {
            mapOf("launched" to false, "reason" to (t.message ?: "share_failed"))
        }
    }

    private fun shareToSnapchat(
        filePath: String?,
        mimeType: String,
        caption: String,
        snapClientId: String
    ): Map<String, Any> {
        if (!isPackageInstalled("com.snapchat.android")) {
            return mapOf("launched" to false, "reason" to "snapchat_not_installed")
        }
        val uri = filePath?.takeIf { it.isNotBlank() }?.let { contentUriForPath(it) }
        val intent = Intent(Intent.ACTION_SEND).apply {
            setPackage("com.snapchat.android")
            type = if (uri != null) mimeType else "text/plain"
            if (uri != null) {
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            if (caption.isNotBlank()) {
                putExtra(Intent.EXTRA_TEXT, caption)
            }
        }
        return try {
            startActivity(intent)
            mapOf(
                "launched" to true,
                "mode" to "direct_send",
                "needsSnapClientId" to snapClientId.isBlank()
            )
        } catch (t: Throwable) {
            mapOf("launched" to false, "reason" to (t.message ?: "share_failed"))
        }
    }

    private fun shareMediaToPackage(
        packageName: String?,
        filePath: String?,
        mimeType: String,
        text: String?
    ): Boolean {
        val uri = filePath?.takeIf { it.isNotBlank() }?.let { contentUriForPath(it) }
        val intent = Intent(Intent.ACTION_SEND).apply {
            type = if (uri != null) mimeType else "text/plain"
            if (!packageName.isNullOrBlank()) {
                if (packageName == "com.whatsapp" &&
                    !isPackageInstalled("com.whatsapp") &&
                    isPackageInstalled("com.whatsapp.w4b")
                ) {
                    setPackage("com.whatsapp.w4b")
                } else {
                    setPackage(packageName)
                }
            }
            if (uri != null) {
                putExtra(Intent.EXTRA_STREAM, uri)
                addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION)
            }
            if (!text.isNullOrBlank()) {
                putExtra(Intent.EXTRA_TEXT, text)
            }
        }
        return try {
            if (packageName.isNullOrBlank()) {
                startActivity(Intent.createChooser(intent, "Share from Wavelength"))
            } else {
                startActivity(intent)
            }
            true
        } catch (_: Throwable) {
            false
        }
    }

    private fun saveImageToGallery(filePath: String, displayName: String): String? {
        val src = File(filePath)
        if (!src.exists()) return null
        val values = ContentValues().apply {
            put(MediaStore.Images.Media.DISPLAY_NAME, displayName)
            put(MediaStore.Images.Media.MIME_TYPE, "image/png")
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                put(MediaStore.Images.Media.RELATIVE_PATH, Environment.DIRECTORY_PICTURES + "/Wavelength")
                put(MediaStore.Images.Media.IS_PENDING, 1)
            }
        }
        val resolver = applicationContext.contentResolver
        val uri = resolver.insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, values) ?: return null
        resolver.openOutputStream(uri)?.use { out ->
            FileInputStream(src).use { input ->
                input.copyTo(out)
            }
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val done = ContentValues().apply { put(MediaStore.Images.Media.IS_PENDING, 0) }
            resolver.update(uri, done, null, null)
        }
        return uri.toString()
    }

    private fun updateWidgetAndTileState(
        title: String,
        artist: String,
        isPlaying: Boolean,
        artPath: String?
    ) {
        val prefs = getSharedPreferences(WavelengthMediaWidgetProvider.PREFS_NAME, Context.MODE_PRIVATE)
        prefs.edit()
            .putString(WavelengthMediaWidgetProvider.KEY_TITLE, title)
            .putString(WavelengthMediaWidgetProvider.KEY_ARTIST, artist)
            .putBoolean(WavelengthMediaWidgetProvider.KEY_IS_PLAYING, isPlaying)
            .putString(WavelengthMediaWidgetProvider.KEY_ART_PATH, artPath)
            .apply()

        WavelengthMediaWidgetProvider.updateAll(applicationContext)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            try {
                TileService.requestListeningState(
                    applicationContext,
                    ComponentName(applicationContext, WavelengthQuickTileService::class.java)
                )
            } catch (_: Throwable) {}
        }
    }

    private fun openBatteryOptimizationSettings(): Boolean {
        return try {
            val intent = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS)
            } else {
                Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
                    data = Uri.parse("package:$packageName")
                }
            }
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            startActivity(intent)
            true
        } catch (_: Throwable) {
            false
        }
    }
}
