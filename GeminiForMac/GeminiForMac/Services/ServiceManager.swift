//
//  ServiceManager.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/14.
//

import Foundation
import SwiftUI

@MainActor
class ServiceManager: ObservableObject {
    @Published var isServiceRunning = false
    @Published var isRestarting = false
    @Published var errorMessage: String?
    
    init() {
        Task {
            await checkServiceStatus()
        }
    }
    
    // 检查服务状态
    func checkServiceStatus() async {
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/launchctl")
        process.arguments = ["list", "com.gemini.cli.server"]
        
        do {
            let output = try process.runAndWaitForOutput()
            isServiceRunning = output.contains("com.gemini.cli.server")
            errorMessage = nil
        } catch {
            isServiceRunning = false
            errorMessage = String(format: String(localized: "检查服务状态失败: %@"), error.localizedDescription)
        }
    }
    
    // 重启服务
    func restartService() async -> Bool {
        isRestarting = true
        errorMessage = nil
        
        defer { isRestarting = false }
        
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/launchctl")
        process.arguments = ["kickstart", "-k", "gui/\(getCurrentUserID())/com.gemini.cli.server"]
        
        do {
            try process.run()
            process.waitUntilExit()
            
            // 等待服务重启
            try await Task.sleep(nanoseconds: 2_000_000_000) // 2秒
            
            // 检查服务状态
            await checkServiceStatus()
            return isServiceRunning
        } catch {
            errorMessage = String(format: String(localized: "重启服务失败: %@"), error.localizedDescription)
            return false
        }
    }
    
    // 获取当前用户ID
    private func getCurrentUserID() -> String {
        return String(getuid())
    }
}

// Process 扩展，用于获取输出
extension Process {
    func runAndWaitForOutput() throws -> String {
        let pipe = Pipe()
        standardOutput = pipe
        standardError = pipe
        
        try run()
        waitUntilExit()
        
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        return String(data: data, encoding: .utf8) ?? ""
    }
} 
