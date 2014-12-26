package org.linkeddatafragments.csparqltrain.irail;

import com.google.gson.annotations.SerializedName;

/**
 * iRail result data wrapper.
 * @author Ruben Taelman
 */
public class Result {

    @SerializedName("@context") public Context context;
    @SerializedName("@graph") public Graph[] graphs;

}
