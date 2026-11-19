import SwiftUI
import Combine
#if canImport(UIKit)
import UIKit
#endif

// Shared pieces of the phone designs.

/// N + NESOS + νῆσος · nê·sos
struct Wordmark: View {
    var body: some View {
        HStack(spacing: 10) {
            Text("N")
                .font(NFont.playfair(34))
                .foregroundStyle(Theme.logoN)
            VStack(alignment: .leading, spacing: 2) {
                Text("NESOS")
                    .font(NFont.playfair(19))
                    .tracking(19 * 0.06)
                    .foregroundStyle(Theme.accent)
                Text("νῆσος · nê·sos")
                    .font(NFont.inter(9))
                    .tracking(9 * 0.14)
                    .foregroundStyle(Theme.inkLight)
            }
        }
        .accessibilityElement(children: .ignore)
        .accessibilityLabel("Nesos")
    }
}

/// The 44pt frosted circle buttons (back, account).
struct CircleIconButton: View {
    let icon: NIcon
    let label: String
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            Icon(icon, size: 20)
                .foregroundStyle(Theme.inkLight)
                .frame(width: 44, height: 44)
                .background(Color.white.opacity(0.55), in: Circle())
                .overlay(Circle().stroke(Color.white.opacity(0.8), lineWidth: 1))
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}

/// Top of every phone screen. Home: wordmark left. Inner screens: back,
/// wordmark in the middle, account.
struct HeaderBar: View {
    var onBack: (() -> Void)?
    var onAccount: (() -> Void)?

    var body: some View {
        HStack {
            if let onBack {
                CircleIconButton(icon: .back, label: "Back", action: onBack)
                Spacer()
                Wordmark()
                Spacer()
            } else {
                Wordmark()
                Spacer()
            }
            if let onAccount {
                CircleIconButton(icon: .person, label: "Account", action: onAccount)
            } else {
                Color.clear.frame(width: 44, height: 44)
            }
        }
        .padding(.bottom, 18)
    }
}

/// "PROJECTS ... ADD +" and "TASKS ... ADD +" rows.
struct SectionHeader: View {
    let title: String
    var isOpen = false
    var addColor: Color = Theme.accent
    var titleColor: Color = Theme.inkSoft
    let onToggle: () -> Void

    var body: some View {
        HStack {
            Text(title).caps(11, spacing: 0.24).foregroundStyle(titleColor)
            Spacer()
            Button(action: onToggle) {
                HStack(spacing: 6) {
                    Text(isOpen ? "CLOSE" : "ADD").caps(11, spacing: 0.24)
                    Icon(isOpen ? .close : .plus, size: 13)
                }
                .foregroundStyle(isOpen ? Theme.inkLight : addColor)
                .frame(height: 28)
                .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
        }
        .padding(.trailing, 13)
    }
}

/// The see-through band along the bottom of a tile.
struct TileBar<Content: View>: View {
    var height: CGFloat = 24
    var leading: CGFloat = 12
    var trailing: CGFloat = 8
    @ViewBuilder var content: Content

    var body: some View {
        HStack(spacing: 8) { content }
            .padding(.leading, leading)
            .padding(.trailing, trailing)
            .frame(height: height)
            .frame(maxWidth: .infinity)
            .background(Color.white.opacity(0.22))
    }
}

/// White frosted card with the thin white border.
struct CardBackground: ViewModifier {
    var opacity: Double = 0.6
    var border: Color = Theme.cardBorder

    func body(content: Content) -> some View {
        content
            .background(Color.white.opacity(opacity), in: RoundedRectangle(cornerRadius: 7))
            .overlay(RoundedRectangle(cornerRadius: 7).stroke(border, lineWidth: 1))
    }
}

extension View {
    func card(_ opacity: Double = 0.6, border: Color = Theme.cardBorder) -> some View {
        modifier(CardBackground(opacity: opacity, border: border))
    }

    /// Frosted glass, for floating buttons.
    func frosted(radius: CGFloat = 7) -> some View {
        background(Color.white.opacity(0.2), in: RoundedRectangle(cornerRadius: radius))
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: radius))
            .overlay(RoundedRectangle(cornerRadius: radius).stroke(Theme.cardBorder, lineWidth: 1))
            .shadow(color: Theme.accent.opacity(0.08), radius: 7, y: 4)
    }

    /// The soft fade at the bottom of scrolling lists.
    func scrollFade() -> some View {
        mask(
            LinearGradient(stops: [
                .init(color: .black, location: 0),
                .init(color: .black, location: 0.9),
                .init(color: .black.opacity(0.35), location: 1),
            ], startPoint: .top, endPoint: .bottom)
        )
    }
}

/// A vertical scroll area with the always-visible thin scroll bar from the
/// designs (5pt wide, 8pt gap from the content).
struct BarScroll<Content: View>: View {
    var thumb: Color = Theme.accent.opacity(0.45)
    var gap: CGFloat = 8
    /// Shrink to the content's height (up to the space available).
    var hugs = false
    let content: Content

    init(thumb: Color = Theme.accent.opacity(0.45), gap: CGFloat = 8, hugs: Bool = false, @ViewBuilder content: () -> Content) {
        self.thumb = thumb
        self.gap = gap
        self.hugs = hugs
        self.content = content()
    }

    @State private var offset: CGFloat = 0
    @State private var contentHeight: CGFloat = 0
    @State private var viewHeight: CGFloat = 0

    var body: some View {
        ScrollView {
            content
                .padding(.trailing, gap + 5)
                .onGeometryChange(for: CGRect.self) { proxy in
                    proxy.frame(in: .named("bar-scroll"))
                } action: { frame in
                    offset = -frame.minY
                    contentHeight = frame.height
                }
        }
        .coordinateSpace(.named("bar-scroll"))
        .scrollIndicators(.hidden)
        .onGeometryChange(for: CGFloat.self) { $0.size.height } action: { viewHeight = $0 }
        .overlay(alignment: .topTrailing) { bar }
        .frame(maxHeight: hugs && contentHeight > 0 ? contentHeight : .infinity)
    }

    @ViewBuilder private var bar: some View {
        if contentHeight > viewHeight + 1, viewHeight > 0 {
            let thumbHeight = max(28, viewHeight * viewHeight / contentHeight)
            let progress = min(1, max(0, offset / (contentHeight - viewHeight)))
            ZStack(alignment: .top) {
                Capsule().fill(Color.white.opacity(0.45))
                Capsule().fill(thumb)
                    .frame(height: thumbHeight)
                    .offset(y: progress * (viewHeight - thumbHeight))
            }
            .frame(width: 5, height: viewHeight)
            .allowsHitTesting(false)
        }
    }
}

/// Date chip on task rows ("Nov 4").
struct DueChip: View {
    let text: String?
    let tint: Tint
    var faded = false

    var body: some View {
        Group {
            if let text {
                Text(text)
                    .font(NFont.playfair(10))
                    .foregroundStyle(.white)
                    .frame(width: 42)
                    .padding(.vertical, 2)
                    .background(faded ? tint.opacity(0.45) : tint.fill, in: RoundedRectangle(cornerRadius: 4))
            } else {
                Color.clear.frame(width: 42, height: 1)
            }
        }
    }
}

/// The round check on task rows.
struct CheckCircle: View {
    let done: Bool
    let tint: Tint

    var body: some View {
        ZStack {
            if done {
                Circle().fill(tint.fill)
                Icon(.check, size: 11).foregroundStyle(.white)
            } else {
                Circle().strokeBorder(Theme.ink.opacity(0.28), lineWidth: 1.5)
            }
        }
        .frame(width: 20, height: 20)
    }
}

/// One task row. `projectName` shows the project under the text (Due screen).
struct TaskRow: View {
    let task: ProjectTask
    let tint: Tint
    var projectName: String?
    var height: CGFloat = 44
    var openOpacity: Double = 0.6
    let onToggle: () -> Void
    let onTap: () -> Void

    var body: some View {
        HStack(spacing: 10) {
            DueChip(text: DueDate.label(task.dueDate), tint: tint, faded: task.done)
            VStack(alignment: .leading, spacing: 2) {
                Text(task.text)
                    .font(NFont.inter(13))
                    .strikethrough(task.done)
                    .foregroundStyle(task.done ? Theme.inkLight : Theme.ink)
                    .lineLimit(1)
                if let projectName {
                    Text(projectName).caps(9).foregroundStyle(tint.fill).lineLimit(1)
                }
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Button(action: onToggle) {
                CheckCircle(done: task.done, tint: tint)
                    .frame(width: 36, height: 36)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .padding(.trailing, -8)
            .accessibilityLabel(task.done ? "Mark not done" : "Mark done")
        }
        .padding(.horizontal, 12)
        .frame(height: height)
        .card(task.done ? 0.35 : openOpacity, border: Color.white.opacity(task.done && projectName == nil ? 0.6 : 0.85))
        .contentShape(Rectangle())
        .onTapGesture(perform: onTap)
    }
}

/// Quote of the day + date tile.
struct QuoteDateRow: View {
    var body: some View {
        let quote = Quotes.today
        HStack(spacing: 10) {
            VStack(alignment: .leading, spacing: 6) {
                Text(quote.quote)
                    .font(NFont.inter(11))
                    .lineSpacing(11 * 0.4 - 2)
                    .foregroundStyle(Theme.ink)
                    .minimumScaleFactor(0.8)
                Text(quote.byline)
                    .font(NFont.inter(10))
                    .foregroundStyle(Theme.inkLight)
            }
            .padding(.leading, 10)
            .overlay(alignment: .leading) { Rectangle().fill(Theme.sky).frame(width: 2) }
            .padding(12)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
            .card()

            TimelineView(.everyMinute) { context in
                VStack(alignment: .leading, spacing: 0) {
                    Text(Self.format(context.date, "MMMM")).caps(10)
                        .padding([.top, .horizontal], 12)
                    Spacer(minLength: 0)
                    Text(Self.format(context.date, "d"))
                        .font(NFont.playfair(34))
                        .padding(.horizontal, 12)
                    Spacer(minLength: 0)
                    TileBar {
                        Text(Self.format(context.date, "EEEE")).caps(10)
                        Spacer()
                    }
                }
                .foregroundStyle(.white)
                .frame(width: 136)
                .frame(maxHeight: .infinity)
                .background(Theme.sky)
                .clipShape(RoundedRectangle(cornerRadius: 7))
            }
        }
        .frame(height: 108)
        .padding(.trailing, 13)
    }

    private static func format(_ date: Date, _ pattern: String) -> String {
        let f = DateFormatter()
        f.dateFormat = pattern
        return f.string(from: date)
    }
}

/// A short error line shown at the bottom of a screen.
struct ErrorBanner: View {
    let message: String
    let onDismiss: () -> Void

    var body: some View {
        Button(action: onDismiss) {
            Text(message)
                .font(NFont.inter(12))
                .foregroundStyle(Theme.danger)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 14)
                .padding(.vertical, 10)
                .frosted()
        }
        .buttonStyle(.plain)
        .padding(.horizontal, 20)
    }
}

#if os(iOS)
extension View {
    /// Tracks whether the keyboard is up, so screens can make room for it.
    func trackKeyboard(_ visible: Binding<Bool>) -> some View {
        onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillShowNotification)) { _ in
            withAnimation(.easeOut(duration: 0.2)) { visible.wrappedValue = true }
        }
        .onReceive(NotificationCenter.default.publisher(for: UIResponder.keyboardWillHideNotification)) { _ in
            withAnimation(.easeOut(duration: 0.2)) { visible.wrappedValue = false }
        }
    }
}
#endif
