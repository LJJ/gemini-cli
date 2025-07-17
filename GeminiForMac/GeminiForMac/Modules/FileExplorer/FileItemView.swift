//
//  File.swift
//  GeminiForMac
//
//  Created by LJJ on 2025/7/8.
//

import SwiftUI

// 文件项视图
struct FileItemView: View {
    let item: DirectoryItem
    let isSelected: Bool
    let isExpanded: Bool
    let level: Int
    let onTap: () -> Void
    let onDoubleTap: () -> Void
    let onToggleExpansion: () -> Void
    
    var body: some View {
        HStack(spacing: 4) {
            // 层级缩进
            ForEach(0..<level, id: \.self) { _ in
                Rectangle()
                    .fill(Color.clear)
                    .frame(width: 16, height: 1)
            }
            
            // 展开/折叠按钮（仅对文件夹）
            if item.type == "directory" {
                Button(action: {
                    print("🔽 展开按钮点击: \(item.name)")
                    onToggleExpansion()
                }) {
                    Image(systemName: isExpanded ? "chevron.down" : "chevron.right")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                        .frame(width: 12, height: 12)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 3)// 增加图标点击区域
                        .contentShape(Rectangle()) // 确保图标周围也能响应点击
                }
                .buttonStyle(.plain)
                .contentShape(Rectangle()) // 确保按钮整体区域都能点击
            } else {
                // 文件占位符
                Rectangle()
                    .fill(Color.clear)
                    .frame(width: 20, height: 20)
            }
            
            // 文件图标和名称区域（可点击的主要区域）
            HStack(spacing: 4) {
                // 文件图标
                Image(systemName: iconName)
                    .font(.caption)
                    .foregroundColor(iconColor)
                    .frame(width: 16, height: 16)
                
                // 文件名
                Text(item.name)
                    .font(.caption)
                    .foregroundColor(.primary)
                    .lineLimit(1)
                    .truncationMode(.middle)
                
                Spacer()
                
                // 选中状态图标（右侧）
                if isSelected {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.caption2)
                        .foregroundColor(.blue)
                        .frame(width: 16, height: 16)
                }
            }
            .contentShape(Rectangle())
            .gesture(
                TapGesture(count: 2)
                    .onEnded {
                        print("👆👆 双击: \(item.name)")
                        onDoubleTap()
                    }
                    .exclusively(
                        before: TapGesture(count: 1)
                            .onEnded {
                                print("👆 单击: \(item.name)")
                                onTap()
                            }
                    )
            )
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(backgroundColor)
        .contextMenu {
            Button(action: {
                showInFinder()
            }) {
                Label(String(localized: "在 Finder 中显示"), systemImage: "folder")
            }
        }
    }
    
    // 在 Finder 中显示文件
    private func showInFinder() {
        let fullPath = item.path
        let url = URL(fileURLWithPath: fullPath)
        
        // 使用 NSWorkspace 在 Finder 中显示文件
        NSWorkspace.shared.selectFile(fullPath, inFileViewerRootedAtPath: "")
        
        print("📁 在 Finder 中显示: \(fullPath)")
    }
    
    // 背景颜色
    private var backgroundColor: Color {
        if isSelected {
            return Color.blue.opacity(0.1)
        } else {
            return Color.clear
        }
    }
    
    // 根据文件类型返回图标名称
    private var iconName: String {
        if item.type == "directory" {
            return isExpanded ? "folder.fill" : "folder"
        } else {
            let ext = (item.name as NSString).pathExtension.lowercased()
            switch ext {
            case "swift":
                return "swift"
            case "py":
                return "python"
            case "js", "ts":
                return "chevron.left.slash.chevron.right"
            case "html", "htm":
                return "curlybraces"
            case "css", "scss", "less":
                return "paintbrush"
            case "json":
                return "curlybraces.square"
            case "md":
                return "doc.plaintext"
            case "txt", "log":
                return "doc.text"
            case "pdf":
                return "doc.richtext"
            case "jpg", "jpeg", "png", "gif", "bmp", "tiff", "heic":
                return "photo"
            case "mp4", "mov", "avi", "mkv":
                return "film"
            case "mp3", "wav", "aac", "flac":
                return "waveform"
            case "zip", "rar", "7z", "tar", "gz":
                return "archivebox"
            case "csv", "xls", "xlsx":
                return "tablecells"
            case "doc", "docx":
                return "doc"
            case "ppt", "pptx":
                return "chart.bar.doc.horizontal"
            default:
                return "doc"
            }
        }
    }
    
    // 图标颜色
    private var iconColor: Color {
        if item.type == "directory" {
            return .blue
        } else {
            let ext = (item.name as NSString).pathExtension.lowercased()
            switch ext {
            case "swift":
                return .orange
            case "py":
                return .blue
            case "js", "ts":
                return .yellow
            case "html", "htm":
                return .red
            case "css", "scss", "less":
                return .blue
            case "json":
                return .green
            case "md":
                return .purple
            case "pdf":
                return .red
            case "jpg", "jpeg", "png", "gif", "bmp", "tiff", "heic":
                return .pink
            case "mp4", "mov", "avi", "mkv":
                return .purple
            case "mp3", "wav", "aac", "flac":
                return .mint
            case "zip", "rar", "7z", "tar", "gz":
                return .gray
            case "csv", "xls", "xlsx":
                return .green
            case "doc", "docx":
                return .indigo
            case "ppt", "pptx":
                return .orange
            default:
                return .secondary
            }
        }
    }
}
