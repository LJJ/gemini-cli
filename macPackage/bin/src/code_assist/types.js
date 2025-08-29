/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * List of predefined reason codes when a tier is blocked from a specific tier.
 * https://source.corp.google.com/piper///depot/google3/google/internal/cloud/code/v1internal/cloudcode.proto;l=378
 */
export var IneligibleTierReasonCode;
(function (IneligibleTierReasonCode) {
    // go/keep-sorted start
    IneligibleTierReasonCode["DASHER_USER"] = "DASHER_USER";
    IneligibleTierReasonCode["INELIGIBLE_ACCOUNT"] = "INELIGIBLE_ACCOUNT";
    IneligibleTierReasonCode["NON_USER_ACCOUNT"] = "NON_USER_ACCOUNT";
    IneligibleTierReasonCode["RESTRICTED_AGE"] = "RESTRICTED_AGE";
    IneligibleTierReasonCode["RESTRICTED_NETWORK"] = "RESTRICTED_NETWORK";
    IneligibleTierReasonCode["UNKNOWN"] = "UNKNOWN";
    IneligibleTierReasonCode["UNKNOWN_LOCATION"] = "UNKNOWN_LOCATION";
    IneligibleTierReasonCode["UNSUPPORTED_LOCATION"] = "UNSUPPORTED_LOCATION";
    // go/keep-sorted end
})(IneligibleTierReasonCode || (IneligibleTierReasonCode = {}));
/**
 * UserTierId represents IDs returned from the Cloud Code Private API representing a user's tier
 *
 * //depot/google3/cloud/developer_experience/cloudcode/pa/service/usertier.go;l=16
 */
export var UserTierId;
(function (UserTierId) {
    UserTierId["FREE"] = "free-tier";
    UserTierId["LEGACY"] = "legacy-tier";
    UserTierId["STANDARD"] = "standard-tier";
})(UserTierId || (UserTierId = {}));
/**
 * Status code of user license status
 * it does not strictly correspond to the proto
 * Error value is an additional value assigned to error responses from OnboardUser
 */
export var OnboardUserStatusCode;
(function (OnboardUserStatusCode) {
    OnboardUserStatusCode["Default"] = "DEFAULT";
    OnboardUserStatusCode["Notice"] = "NOTICE";
    OnboardUserStatusCode["Warning"] = "WARNING";
    OnboardUserStatusCode["Error"] = "ERROR";
})(OnboardUserStatusCode || (OnboardUserStatusCode = {}));
//# sourceMappingURL=types.js.map