package fm.wavelength.app;

import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import java.io.ByteArrayInputStream;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
            settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            settings.setAllowFileAccess(true);
            settings.setJavaScriptCanOpenWindowsAutomatically(true);

            // Ad-Free Media Engine: Intercept & drop all video advertising network requests
            webView.setWebViewClient(new BridgeWebViewClient(getBridge()) {
                @Override
                public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                    if (request != null && request.getUrl() != null) {
                        String url = request.getUrl().toString().toLowerCase();
                        if (url.contains("doubleclick.net") ||
                            url.contains("googleads") ||
                            url.contains("pagead2") ||
                            url.contains("youtube.com/pagead") ||
                            url.contains("youtube.com/api/stats/ads") ||
                            url.contains("adservice.google") ||
                            url.contains("googlesyndication") ||
                            url.contains("pubads")) {
                            return new WebResourceResponse("text/plain", "UTF-8", new ByteArrayInputStream(new byte[0]));
                        }
                    }
                    return super.shouldInterceptRequest(view, request);
                }
            });
        }
    }
}
