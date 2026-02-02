package com.twinbolt.stuga;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Capacitor plugin to check Google Mobile Services availability.
 * Allows the JavaScript layer to determine if Firebase can be safely used.
 */
@CapacitorPlugin(name = "GmsChecker")
public class GmsCheckerPlugin extends Plugin {

    @PluginMethod
    public void isAvailable(PluginCall call) {
        boolean available = GmsHelper.isGmsAvailable(getContext());
        JSObject result = new JSObject();
        result.put("available", available);
        call.resolve(result);
    }
}
