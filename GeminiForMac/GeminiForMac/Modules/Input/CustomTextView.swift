
import SwiftUI
import AppKit

@MainActor
struct CustomTextView: NSViewRepresentable {
    @Binding var text: String
    @Binding var dynamicHeight: CGFloat
    
    var onCommit: () -> Void
    
    private let minHeight: CGFloat = 38 // Adjusted for padding
    private let maxHeight: CGFloat = 100

    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }

    func makeNSView(context: Context) -> NSScrollView {
        let textView = NSTextView()
        textView.delegate = context.coordinator
        
        textView.font = NSFont.systemFont(ofSize: 14)
        textView.isRichText = false
        textView.isEditable = true
        textView.isSelectable = true
        textView.allowsUndo = true
        
        textView.isVerticallyResizable = true
        textView.isHorizontallyResizable = false
        textView.textContainer?.widthTracksTextView = true
        
        // Add internal padding
        textView.textContainerInset = NSSize(width: 8, height: 8)
        
        // 使用系统适配的文字颜色，支持日夜间模式
        textView.textColor = NSColor.labelColor
        
        // 强制刷新显示
        textView.needsDisplay = true
        
        // 确保文字容器设置正确
        textView.textContainer?.lineFragmentPadding = 0
        
        let scrollView = NSScrollView()
        scrollView.documentView = textView
        scrollView.hasVerticalScroller = false
        
        // 设置合理的文本容器大小以支持动态高度
        textView.maxSize = NSSize(width: CGFloat.greatestFiniteMagnitude, height: CGFloat.greatestFiniteMagnitude)
        textView.textContainer?.containerSize = NSSize(width: 0, height: CGFloat.greatestFiniteMagnitude)

        // 设置文本内容，并确保颜色设置生效
        textView.string = text
        
        context.coordinator.recalculateHeight(for: textView)
        
        // Set focus when the view appears
        DispatchQueue.main.async {
            textView.window?.makeFirstResponder(textView)
        }
        
        return scrollView
    }

    func updateNSView(_ nsView: NSScrollView, context: Context) {
        guard let textView = nsView.documentView as? NSTextView else { return }
        
        // 确保 textView 有正确的宽度
        let scrollViewWidth = nsView.bounds.width
        if textView.frame.width != scrollViewWidth {
            textView.frame.size.width = scrollViewWidth
            textView.textContainer?.size.width = scrollViewWidth
            // 宽度变化时重新计算高度
            context.coordinator.recalculateHeight(for: textView)
        }
        
        if textView.string != text {
            textView.string = text
            // 文本变化时重新计算高度
            context.coordinator.recalculateHeight(for: textView)
        }
        
        // 确保文字颜色在更新时也保持正确
        textView.textColor = NSColor.labelColor
    }

    @MainActor
    class Coordinator: NSObject, NSTextViewDelegate {
        var parent: CustomTextView

        init(_ parent: CustomTextView) {
            self.parent = parent
        }

        func textDidChange(_ notification: Notification) {
            guard let textView = notification.object as? NSTextView else { return }
            parent.text = textView.string
            // 使用系统适配的文字颜色，支持日夜间模式
            textView.textColor = NSColor.labelColor
            recalculateHeight(for: textView)
        }
        
        func recalculateHeight(for textView: NSTextView) {
            guard let layoutManager = textView.layoutManager, 
                  let textContainer = textView.textContainer else { return }
            
            // 确保布局管理器完成布局
            layoutManager.ensureLayout(for: textContainer)
            
            // 获取实际使用的文本区域
            let usedRect = layoutManager.usedRect(for: textContainer)
            
            // 计算内容高度，包括上下内边距
            let contentHeight = usedRect.height + textView.textContainerInset.height * 2
            
            // 确保高度在最小值和最大值之间
            let newHeight = min(parent.maxHeight, max(parent.minHeight, contentHeight))
            
            // 只有当高度变化超过1像素时才更新，避免频繁更新
            if abs(parent.dynamicHeight - newHeight) > 1 {
                DispatchQueue.main.async {
                    self.parent.dynamicHeight = newHeight
                }
            }
            
            // 根据内容是否超出最大高度来决定是否显示滚动条
            if let scrollView = textView.enclosingScrollView {
                let contentExceedsMax = contentHeight > parent.maxHeight
                if scrollView.hasVerticalScroller != contentExceedsMax {
                    scrollView.hasVerticalScroller = contentExceedsMax
                }
            }
        }

        func textView(_ textView: NSTextView, doCommandBy commandSelector: Selector) -> Bool {
            if commandSelector == #selector(NSResponder.insertNewline(_:)) {
                if let event = NSApp.currentEvent, event.modifierFlags.contains(.shift) {
                    // Shift+Enter: allow default behavior
                    return false
                } else {
                    // Enter: commit and prevent newline
                    parent.onCommit()
                    return true
                }
            }
            // Allow default behavior for all other commands
            return false
        }
    }
}
