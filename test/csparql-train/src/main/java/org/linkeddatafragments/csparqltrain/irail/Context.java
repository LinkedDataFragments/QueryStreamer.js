package org.linkeddatafragments.csparqltrain.irail;

import com.google.gson.annotations.SerializedName;

/**
 * @author rubensworks
 */
public class Context extends DataBase {

    public Stop stop;

    public static final class Stop {

        @SerializedName("@id") public String id;
        @SerializedName("@type") public String type;


    }

}
