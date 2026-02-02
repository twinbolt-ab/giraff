package com.twinbolt.stuga;

import android.content.Context;

import com.google.android.gms.common.ConnectionResult;
import com.google.android.gms.common.GoogleApiAvailability;

/**
 * Helper class to check Google Mobile Services availability.
 * Used to gracefully handle Huawei and other non-GMS devices.
 */
public class GmsHelper {

    /**
     * Check if Google Play Services is available and functional.
     * @param context Application context
     * @return true if GMS is available and can be used
     */
    public static boolean isGmsAvailable(Context context) {
        try {
            GoogleApiAvailability apiAvailability = GoogleApiAvailability.getInstance();
            int resultCode = apiAvailability.isGooglePlayServicesAvailable(context);
            return resultCode == ConnectionResult.SUCCESS;
        } catch (Exception e) {
            // If we can't even check, GMS is definitely not available
            return false;
        }
    }
}
