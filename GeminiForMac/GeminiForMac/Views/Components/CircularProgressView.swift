//
//  CircularProgressView.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/8/7.
//

import SwiftUI
import Factory

struct CircularProgressView: View {
    let percentage: Double // 0.0-1.0 的小数
    let size: CGFloat
    let lineWidth: CGFloat
    
    init(percentage: Double, size: CGFloat = 32, lineWidth: CGFloat = 3) {
        self.percentage = max(0.0, min(1.0, percentage))
        self.size = size
        self.lineWidth = lineWidth
    }
    
    var body: some View {
        ZStack {
            // 背景圆环
            Circle()
                .stroke(Color.gray.opacity(0.2), lineWidth: lineWidth)
                .frame(width: size, height: size)
            
            // 进度圆环
            Circle()
                .trim(from: 0, to: percentage)
                .stroke(
                    progressColor,
                    style: StrokeStyle(
                        lineWidth: lineWidth,
                        lineCap: .round
                    )
                )
                .frame(width: size, height: size)
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 0.3), value: percentage)
            
            // 中心百分比文字
            Text("\(Int(percentage * 100))%")
                .font(.system(size: size * 0.25, weight: .medium))
                .foregroundColor(.primary)
        }
    }
    
    private var progressColor: Color {
        if percentage <= 0.2 {
            return .red
        } else if percentage <= 0.4 {
            return .orange
        } else if percentage <= 0.6 {
            return .yellow
        } else {
            return .green
        }
    }
}

struct TokenUsageView: View {
    @ObservedObject private var chatService = Container.shared.chatService.resolve()
    
    var body: some View {
        // 只在有数据时显示（不是默认的1.0）
        if chatService.contextRemainingPercentage < 1.0 {
            HStack(spacing: 8) {
                // 环形进度条
                CircularProgressView(percentage: chatService.contextRemainingPercentage, size: 28, lineWidth: 3)
                
                // 详细信息
                VStack(alignment: .leading, spacing: 2) {
                    // Context剩余百分比
                    Text("context remaining")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(Color(NSColor.controlBackgroundColor))
            .overlay(
                RoundedRectangle(cornerRadius: 6)
                    .stroke(Color.gray.opacity(0.3), lineWidth: 1)
            )
            .cornerRadius(6)
        }
    }
}

#Preview {
    VStack(spacing: 20) {
        CircularProgressView(percentage: 0.52, size: 32, lineWidth: 3)
        CircularProgressView(percentage: 0.14, size: 32, lineWidth: 3)
        CircularProgressView(percentage: 0.28, size: 32, lineWidth: 3)
        CircularProgressView(percentage: 0.05, size: 32, lineWidth: 3)
        
        TokenUsageView()
    }
    .padding()
} 
