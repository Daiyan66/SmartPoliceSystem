package com.smartpolice.security;

public enum Role {
    ROLE_CITIZEN("Verified Citizen"),
    ROLE_CONSTABLE("Police Constable"),
    ROLE_HEAD_CONSTABLE("Head Constable"),
    ROLE_ASI("Assistant Sub-Inspector"),
    ROLE_SUB_INSPECTOR("Sub-Inspector (IO)"),
    ROLE_SHO("Station House Officer (Inspector)"),
    ROLE_DSP_ASP("Deputy / Assistant SP"),
    ROLE_SP_SSP("Superintendent of Police (District Head)"),
    ROLE_DIG_DGP("Director General of Police (State Head)"),
    ROLE_ADMIN("System Administrator");

    private final String description;

    Role(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}
