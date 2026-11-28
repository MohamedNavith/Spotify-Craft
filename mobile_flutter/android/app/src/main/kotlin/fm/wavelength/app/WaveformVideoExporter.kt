package fm.wavelength.app

import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.RectF
import android.graphics.Shader
import android.graphics.Typeface
import android.media.MediaCodec
import android.media.MediaCodecInfo
import android.media.MediaFormat
import android.media.MediaMuxer
import java.io.File
import kotlin.math.abs
import kotlin.math.max
import kotlin.math.sin

object WaveformVideoExporter {

    fun exportStoryClip(
        artworkPath: String?,
        title: String,
        artist: String,
        accentColorInt: Int,
        durationSeconds: Int,
        outputPath: String
    ): String {
        val width = 720
        val height = 1280
        val fps = 24
        val totalFrames = (durationSeconds.coerceIn(5, 30)) * fps

        val outFile = File(outputPath)
        outFile.parentFile?.mkdirs()
        if (outFile.exists()) outFile.delete()

        val format = MediaFormat.createVideoFormat(MediaFormat.MIMETYPE_VIDEO_AVC, width, height).apply {
            setInteger(
                MediaFormat.KEY_COLOR_FORMAT,
                MediaCodecInfo.CodecCapabilities.COLOR_FormatSurface
            )
            setInteger(MediaFormat.KEY_BIT_RATE, 2_400_000)
            setInteger(MediaFormat.KEY_FRAME_RATE, fps)
            setInteger(MediaFormat.KEY_I_FRAME_INTERVAL, 2)
        }

        val codec = MediaCodec.createEncoderByType(MediaFormat.MIMETYPE_VIDEO_AVC)
        val muxer = MediaMuxer(outFile.absolutePath, MediaMuxer.OutputFormat.MUXER_OUTPUT_MPEG_4)
        var trackIndex = -1
        var muxerStarted = false
        var artBitmap: Bitmap? = null

        try {
            codec.configure(format, null, null, MediaCodec.CONFIGURE_FLAG_ENCODE)
            val surface = codec.createInputSurface()
            codec.start()

            if (!artworkPath.isNullOrBlank()) {
                val f = File(artworkPath)
                if (f.exists()) {
                    val raw = BitmapFactory.decodeFile(f.absolutePath)
                    if (raw != null) {
                        artBitmap = Bitmap.createScaledBitmap(raw, 480, 480, true)
                        if (artBitmap != raw) raw.recycle()
                    }
                }
            }

            val darkAccent = Color.argb(
                255,
                max(12, Color.red(accentColorInt) / 4),
                max(16, Color.green(accentColorInt) / 4),
                max(14, Color.blue(accentColorInt) / 4)
            )
            val bgPaint = Paint(Paint.ANTI_ALIAS_FLAG)
            val cardPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.argb(190, 18, 18, 18)
            }
            val artPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
            val barPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = accentColorInt
            }
            val barBgPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.argb(70, 255, 255, 255)
            }
            val titlePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.WHITE
                textSize = 40f
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                textAlign = Paint.Align.CENTER
            }
            val artistPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.argb(215, 230, 230, 230)
                textSize = 27f
                textAlign = Paint.Align.CENTER
            }
            val badgePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = accentColorInt
                textSize = 20f
                typeface = Typeface.create(Typeface.DEFAULT, Typeface.BOLD)
                textAlign = Paint.Align.CENTER
            }
            val footerPaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
                color = Color.argb(175, 255, 255, 255)
                textSize = 20f
                textAlign = Paint.Align.CENTER
            }

            val bufferInfo = MediaCodec.BufferInfo()

            fun drainEncoder(endOfStream: Boolean) {
                if (endOfStream) codec.signalEndOfInputStream()
                while (true) {
                    val outIdx = codec.dequeueOutputBuffer(bufferInfo, 10_000)
                    when {
                        outIdx == MediaCodec.INFO_TRY_AGAIN_LATER -> {
                            if (!endOfStream) break
                        }
                        outIdx == MediaCodec.INFO_OUTPUT_FORMAT_CHANGED -> {
                            if (muxerStarted) throw IllegalStateException("Muxer format changed twice")
                            trackIndex = muxer.addTrack(codec.outputFormat)
                            muxer.start()
                            muxerStarted = true
                        }
                        outIdx >= 0 -> {
                            val encoded = codec.getOutputBuffer(outIdx) ?: continue
                            if ((bufferInfo.flags and MediaCodec.BUFFER_FLAG_CODEC_CONFIG) != 0) {
                                bufferInfo.size = 0
                            }
                            if (bufferInfo.size > 0 && muxerStarted) {
                                encoded.position(bufferInfo.offset)
                                encoded.limit(bufferInfo.offset + bufferInfo.size)
                                muxer.writeSampleData(trackIndex, encoded, bufferInfo)
                            }
                            codec.releaseOutputBuffer(outIdx, false)
                            if ((bufferInfo.flags and MediaCodec.BUFFER_FLAG_END_OF_STREAM) != 0) {
                                break
                            }
                        }
                    }
                }
            }

            val clippedTitle = if (title.length > 26) title.take(25) + "..." else title
            val clippedArtist = if (artist.length > 34) artist.take(33) + "..." else artist

            for (frame in 0 until totalFrames) {
                drainEncoder(false)
                val canvas: Canvas = surface.lockCanvas(null)
                try {
                    bgPaint.shader = LinearGradient(
                        0f, 0f, width.toFloat(), height.toFloat(),
                        intArrayOf(darkAccent, Color.rgb(12, 12, 14), accentColorInt),
                        floatArrayOf(0f, 0.58f, 1f),
                        Shader.TileMode.CLAMP
                    )
                    canvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), bgPaint)

                    val cardRect = RectF(64f, 180f, width - 64f, height - 180f)
                    canvas.drawRoundRect(cardRect, 40f, 40f, cardPaint)

                    val artLeft = (width - 460f) / 2f
                    val artTop = 250f
                    val artRect = RectF(artLeft, artTop, artLeft + 460f, artTop + 460f)
                    val bmp = artBitmap
                    if (bmp != null) {
                        canvas.drawBitmap(bmp, null, artRect, artPaint)
                    } else {
                        barPaint.color = darkAccent
                        canvas.drawRoundRect(artRect, 24f, 24f, barPaint)
                        barPaint.color = accentColorInt
                    }

                    canvas.drawText(clippedTitle, width / 2f, 780f, titlePaint)
                    canvas.drawText(clippedArtist, width / 2f, 825f, artistPaint)

                    // Animated equalizer bars
                    val barCount = 26
                    val barWidth = 10f
                    val barGap = 8f
                    val totalBarsWidth = barCount * barWidth + (barCount - 1) * barGap
                    val startX = (width - totalBarsWidth) / 2f
                    val centerY = 935f
                    val t = frame.toDouble() / fps.toDouble()
                    for (i in 0 until barCount) {
                        val phase = t * 5.2 + i * 0.48
                        val norm = 0.25 + 0.75 * abs(sin(phase) * sin(phase * 0.63 + i * 0.2))
                        val barHeight = (18.0 + norm * 82.0).toFloat()
                        val left = startX + i * (barWidth + barGap)
                        val bgRect = RectF(left, centerY - 52f, left + barWidth, centerY + 52f)
                        canvas.drawRoundRect(bgRect, 5f, 5f, barBgPaint)
                        val fgRect = RectF(
                            left,
                            centerY - barHeight / 2f,
                            left + barWidth,
                            centerY + barHeight / 2f
                        )
                        val playedProgress = frame.toFloat() / totalFrames.toFloat()
                        barPaint.color = if (i.toFloat() / barCount <= playedProgress) {
                            accentColorInt
                        } else {
                            Color.argb(190, 255, 255, 255)
                        }
                        canvas.drawRoundRect(fgRect, 5f, 5f, barPaint)
                    }

                    canvas.drawText("NOW PLAYING • WAVELENGTH", width / 2f, 1045f, badgePaint)
                    canvas.drawText("Open in Wavelength to stream", width / 2f, 1185f, footerPaint)
                } finally {
                    surface.unlockCanvasAndPost(canvas)
                }
            }

            drainEncoder(true)
            surface.release()
        } finally {
            artBitmap?.recycle()
            try {
                codec.stop()
            } catch (_: Throwable) {}
            try {
                codec.release()
            } catch (_: Throwable) {}
            if (muxerStarted) {
                try {
                    muxer.stop()
                } catch (_: Throwable) {}
            }
            try {
                muxer.release()
            } catch (_: Throwable) {}
        }

        return outFile.absolutePath
    }
}
