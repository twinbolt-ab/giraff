package com.twinbolt.stuga;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.Window;
import android.webkit.WebView;

import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Register GmsChecker plugin before Capacitor initializes
        registerPlugin(GmsCheckerPlugin.class);

        super.onCreate(savedInstanceState);

        int darkColor = Color.parseColor("#0D0D0C");
        Window window = getWindow();

        // Set window background
        window.getDecorView().setBackgroundColor(darkColor);

        // For Android 15+ (SDK 35+), system bars are edge-to-edge by default
        // We opt out to maintain traditional behavior for the WebView
        if (Build.VERSION.SDK_INT >= 35) {
            // Disable edge-to-edge enforced by Android 15
            WindowCompat.setDecorFitsSystemWindows(window, true);
        }

        // Set system bar colors (deprecated but still functional for SDK < 35)
        window.setStatusBarColor(darkColor);
        window.setNavigationBarColor(darkColor);

        // Make status bar and navigation bar icons light (for dark background)
        WindowInsetsControllerCompat insetsController = WindowCompat.getInsetsController(window, window.getDecorView());
        insetsController.setAppearanceLightStatusBars(false);
        insetsController.setAppearanceLightNavigationBars(false);
    }

    @Override
    public void onStart() {
        super.onStart();
        // Disable overscroll glow/stretch effect on the WebView
        // Wrapped in try-catch for Huawei/non-standard WebView compatibility
        try {
            if (getBridge() != null) {
                WebView webView = getBridge().getWebView();
                if (webView != null) {
                    webView.setOverScrollMode(View.OVER_SCROLL_NEVER);
                }
            }
        } catch (Exception e) {
            // Bridge not ready yet or WebView unavailable, ignore
        }
    }
}
