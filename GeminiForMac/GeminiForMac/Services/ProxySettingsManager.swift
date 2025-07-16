//
//  ProxySettingsManager.swift
//  GeminiForMac
//
//  Created by AI Assistant on 2025/7/15.
//

import SwiftUI
import Combine

@MainActor
class ProxySettingsManager: ObservableObject {
    static let shared = ProxySettingsManager()
    
    @Published var showProxySettings = false
    
    private init() {}
    
    func openProxySettings() {
        showProxySettings = true
    }
    
    func closeProxySettings() {
        showProxySettings = false
    }
}