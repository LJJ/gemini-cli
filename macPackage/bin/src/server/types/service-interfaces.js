/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */
/**
 * 服务状态枚举
 */
export var ServiceStatus;
(function (ServiceStatus) {
    ServiceStatus["UNINITIALIZED"] = "uninitialized";
    ServiceStatus["INITIALIZING"] = "initializing";
    ServiceStatus["INITIALIZED"] = "initialized";
    ServiceStatus["CONFIGURING"] = "configuring";
    ServiceStatus["CONFIGURED"] = "configured";
    ServiceStatus["ERROR"] = "error";
    ServiceStatus["CLEANUP"] = "cleanup";
})(ServiceStatus || (ServiceStatus = {}));
//# sourceMappingURL=service-interfaces.js.map