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
    @Published var isStartingService = false
    @Published var isStoppingService = false
    @Published var errorMessage: String?
    
    private let plistPath = "\(NSHomeDirectory())/Library/LaunchAgents/com.gemini.cli.server.plist"
    
    init() {
        // 初始化时检查服务状态
        Task {
            await checkServiceStatus()
        }
        
        // 监听应用生命周期
        setupAppLifecycleObservers()
    }
    
    // 设置应用生命周期监听
    private func setupAppLifecycleObservers() {
        // 应用启动时启动服务
        NotificationCenter.default.addObserver(
            forName: NSApplication.didFinishLaunchingNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                await self?.startService()
            }
        }
        
        // 应用退出时停止服务
        NotificationCenter.default.addObserver(
            forName: NSApplication.willTerminateNotification,
            object: nil,
            queue: .main
        ) { [weak self] _ in
            Task { @MainActor in
                await self?.stopService()
            }
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
            errorMessage = "检查服务状态失败: \(error.localizedDescription)"
        }
    }
    
    // 启动服务
    func startService() async -> Bool {
        guard !isServiceRunning else { return true }
        
        isStartingService = true
        errorMessage = nil
        
        defer { isStartingService = false }
        
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/launchctl")
        process.arguments = ["bootstrap", "gui/\(getCurrentUserID())", plistPath]
        
        do {
            try process.run()
            process.waitUntilExit()
            
            // 等待服务启动
            try await Task.sleep(nanoseconds: 3_000_000_000) // 3秒
            
            // 再次检查服务状态
            await checkServiceStatus()
            return isServiceRunning
        } catch {
            errorMessage = "启动服务失败: \(error.localizedDescription)"
            return false
        }
    }
    
    // 停止服务
    func stopService() async -> Bool {
        guard isServiceRunning else { return true }
        
        isStoppingService = true
        errorMessage = nil
        
        defer { isStoppingService = false }
        
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/launchctl")
        process.arguments = ["bootout", "gui/\(getCurrentUserID())", plistPath]
        
        do {
            try process.run()
            process.waitUntilExit()
            
            // 等待服务停止
            try await Task.sleep(nanoseconds: 1_000_000_000) // 1秒
            
            // 再次检查服务状态
            await checkServiceStatus()
            return !isServiceRunning
        } catch {
            errorMessage = "停止服务失败: \(error.localizedDescription)"
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
