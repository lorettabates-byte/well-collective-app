import SwiftUI
import WidgetKit

private let appGroupIdentifier = "group.com.wellcollective.app"

struct WellCheckEntry: TimelineEntry {
    let date: Date
    let points: String
    let areas: String
    let sleep: String
    let energyIn: String
    let energyOut: String
    let steps: String
    let updatedAt: String
    let reminder: String
    let unreadCount: String
}

struct WellCheckProvider: TimelineProvider {
    func placeholder(in context: Context) -> WellCheckEntry {
        WellCheckEntry(
            date: Date(),
            points: "0 pts",
            areas: "0/6",
            sleep: "--",
            energyIn: "In --",
            energyOut: "Out --",
            steps: "--",
            updatedAt: "Open WELL Check",
            reminder: "Tap to log today",
            unreadCount: "0"
        )
    }

    func getSnapshot(in context: Context, completion: @escaping (WellCheckEntry) -> Void) {
        completion(loadEntry())
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<WellCheckEntry>) -> Void) {
        let entry = loadEntry()
        let nextRefresh = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }

    private func loadEntry() -> WellCheckEntry {
        let defaults = UserDefaults(suiteName: appGroupIdentifier)
        return WellCheckEntry(
            date: Date(),
            points: defaults?.string(forKey: "points") ?? "0 pts",
            areas: defaults?.string(forKey: "areas") ?? "0/6",
            sleep: defaults?.string(forKey: "sleep") ?? "--",
            energyIn: defaults?.string(forKey: "energyIn") ?? "In --",
            energyOut: defaults?.string(forKey: "energyOut") ?? "Out --",
            steps: defaults?.string(forKey: "steps") ?? "--",
            updatedAt: defaults?.string(forKey: "updatedAt") ?? "Tap WELL Check",
            reminder: defaults?.string(forKey: "reminder") ?? "Tap to log today",
            unreadCount: defaults?.string(forKey: "unreadCount") ?? "0"
        )
    }
}

enum WellWidgetStyle {
    case dark
    case light

    var primaryText: Color {
        switch self {
        case .dark:
            return .white
        case .light:
            return Color(red: 0.02, green: 0.07, blue: 0.11)
        }
    }

    var secondaryText: Color {
        switch self {
        case .dark:
            return .white.opacity(0.72)
        case .light:
            return Color(red: 0.09, green: 0.19, blue: 0.25).opacity(0.68)
        }
    }

    var tertiaryText: Color {
        switch self {
        case .dark:
            return .white.opacity(0.62)
        case .light:
            return Color(red: 0.09, green: 0.19, blue: 0.25).opacity(0.56)
        }
    }

    var chipBackground: Color {
        switch self {
        case .dark:
            return .white.opacity(0.10)
        case .light:
            return Color(red: 0.02, green: 0.22, blue: 0.28).opacity(0.08)
        }
    }

    var pointsChipBackground: Color {
        switch self {
        case .dark:
            return chipBackground
        case .light:
            return WellColor.gold
        }
    }

    var pointsChipText: Color {
        switch self {
        case .dark:
            return WellColor.gold
        case .light:
            return Color(red: 0.05, green: 0.04, blue: 0.02)
        }
    }

    var tileBackground: Color {
        switch self {
        case .dark:
            return .white.opacity(0.10)
        case .light:
            return .white.opacity(0.74)
        }
    }

    var ringTrack: Color {
        switch self {
        case .dark:
            return .white.opacity(0.16)
        case .light:
            return Color(red: 0.02, green: 0.22, blue: 0.28).opacity(0.13)
        }
    }
}

struct WellCheckHomeWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: WellCheckEntry
    let style: WellWidgetStyle

    private var completedAreas: Double {
        let firstValue = entry.areas.split(separator: "/").first.map(String.init) ?? "0"
        return Double(firstValue) ?? 0
    }

    private var areaProgress: Double {
        min(max(completedAreas / 6.0, 0), 1)
    }

    private var unreadNumber: Int {
        Int(entry.unreadCount) ?? 0
    }

    private var unreadLabel: String {
        unreadNumber == 1 ? "1 alert" : "\(unreadNumber) alerts"
    }

    var body: some View {
        Group {
            if family == .systemMedium {
                mediumView
            } else {
                smallView
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .foregroundStyle(style.primaryText)
        .wellWidgetBackground(style: style)
        .widgetURL(URL(string: "wellcollective://well-check"))
    }

    private var smallView: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack(alignment: .top) {
                VStack(alignment: .leading, spacing: 0) {
                    Text("WELL")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .foregroundStyle(WellColor.sky)
                    Text("Check")
                        .font(.system(size: 19, weight: .bold, design: .rounded))
                        .lineLimit(1)
                }

                Spacer(minLength: 6)

                VStack(alignment: .trailing, spacing: 4) {
                    Text(entry.points)
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .foregroundStyle(style.pointsChipText)
                        .lineLimit(1)
                        .minimumScaleFactor(0.7)
                        .padding(.horizontal, 7)
                        .padding(.vertical, 4)
                        .background(style.pointsChipBackground, in: Capsule())

                    if unreadNumber > 0 {
                        Label(unreadLabel, systemImage: "bell.fill")
                            .font(.system(size: 9, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                            .lineLimit(1)
                            .minimumScaleFactor(0.65)
                            .padding(.horizontal, 7)
                            .padding(.vertical, 4)
                            .background(WellColor.alertBlue, in: Capsule())
                    }
                }
            }

            Spacer(minLength: 0)

            HStack(alignment: .center, spacing: 12) {
                AreaRing(
                    value: entry.areas,
                    progress: areaProgress,
                    size: 58,
                    textColor: style.primaryText,
                    mutedTextColor: style.tertiaryText,
                    trackColor: style.ringTrack
                )

                VStack(alignment: .leading, spacing: 7) {
                    MiniMetric(title: "Sleep", value: entry.sleep, color: WellColor.sky, labelColor: style.tertiaryText, valueColor: style.primaryText)
                    MiniMetric(title: "Steps", value: entry.steps, color: WellColor.mint, labelColor: style.tertiaryText, valueColor: style.primaryText)
                }
                .frame(maxWidth: .infinity, alignment: .leading)
            }

            Text(entry.reminder)
                .font(.system(size: 11, weight: .semibold, design: .rounded))
                .foregroundStyle(style.secondaryText)
                .lineLimit(1)
        }
        .padding(14)
    }

    private var mediumView: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack(spacing: 11) {
                AreaRing(
                    value: entry.areas,
                    progress: areaProgress,
                    size: 62,
                    textColor: style.primaryText,
                    mutedTextColor: style.tertiaryText,
                    trackColor: style.ringTrack
                )

                VStack(alignment: .leading, spacing: 3) {
                    Text("WELL Check")
                        .font(.system(size: 20, weight: .bold, design: .rounded))
                    Text("Today's wellness snapshot")
                        .font(.system(size: 12, weight: .medium, design: .rounded))
                        .foregroundStyle(style.secondaryText)
                    Text(entry.updatedAt)
                        .font(.system(size: 11, weight: .semibold, design: .rounded))
                        .foregroundStyle(WellColor.sky.opacity(0.92))
                }

                Spacer(minLength: 0)

                VStack(alignment: .trailing, spacing: 6) {
                    if unreadNumber > 0 {
                        Label(unreadLabel, systemImage: "bell.fill")
                            .font(.system(size: 11, weight: .bold, design: .rounded))
                            .foregroundStyle(.white)
                            .lineLimit(1)
                            .minimumScaleFactor(0.7)
                            .padding(.horizontal, 9)
                            .padding(.vertical, 5)
                            .background(WellColor.alertBlue, in: Capsule())
                    }

                    Text(entry.points)
                        .font(.system(size: 13, weight: .bold, design: .rounded))
                        .foregroundStyle(style.pointsChipText)
                        .padding(.horizontal, 9)
                        .padding(.vertical, 6)
                        .background(style.pointsChipBackground, in: Capsule())
                }
            }

            HStack(spacing: 8) {
                StatTile(title: "Sleep", value: entry.sleep, color: WellColor.sky, labelColor: style.secondaryText, valueColor: style.primaryText, backgroundColor: style.tileBackground)
                StatTile(title: "Steps", value: entry.steps, color: WellColor.mint, labelColor: style.secondaryText, valueColor: style.primaryText, backgroundColor: style.tileBackground)
                StatTile(title: "Energy", value: entry.energyIn.replacingOccurrences(of: "In ", with: ""), color: WellColor.orange, labelColor: style.secondaryText, valueColor: style.primaryText, backgroundColor: style.tileBackground)
            }
        }
        .padding(16)
    }
}

struct AreaRing: View {
    let value: String
    let progress: Double
    let size: CGFloat
    let textColor: Color
    let mutedTextColor: Color
    let trackColor: Color

    var body: some View {
        ZStack {
            Circle()
                .stroke(trackColor, lineWidth: ringWidth)

            Circle()
                .trim(from: 0, to: min(max(progress, 0), 1))
                .stroke(
                    AngularGradient(
                        colors: [WellColor.sky, WellColor.mint, WellColor.sky],
                        center: .center
                    ),
                    style: StrokeStyle(lineWidth: ringWidth, lineCap: .round)
                )
                .rotationEffect(.degrees(-90))

            VStack(spacing: -1) {
                Text(value)
                    .font(.system(size: size * 0.25, weight: .bold, design: .rounded))
                    .foregroundStyle(textColor)
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.65)
                Text("AREAS")
                    .font(.system(size: size * 0.10, weight: .bold, design: .rounded))
                    .foregroundStyle(mutedTextColor)
            }
        }
        .frame(width: size, height: size)
    }

    private var ringWidth: CGFloat {
        max(6, size * 0.12)
    }
}

struct MiniMetric: View {
    let title: String
    let value: String
    let color: Color
    let labelColor: Color
    let valueColor: Color

    var body: some View {
        HStack(spacing: 6) {
            Capsule()
                .fill(color)
                .frame(width: 4, height: 22)

            VStack(alignment: .leading, spacing: 0) {
                Text(title)
                    .font(.system(size: 9, weight: .medium, design: .rounded))
                    .foregroundStyle(labelColor)
                    .lineLimit(1)
                Text(value)
                    .font(.system(size: 14, weight: .bold, design: .rounded))
                    .foregroundStyle(valueColor)
                    .lineLimit(1)
                    .minimumScaleFactor(0.65)
            }
        }
    }
}

struct StatTile: View {
    let title: String
    let value: String
    let color: Color
    let labelColor: Color
    let valueColor: Color
    let backgroundColor: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack(spacing: 5) {
                Circle()
                    .fill(color)
                    .frame(width: 6, height: 6)
                Text(title)
                    .font(.system(size: 10, weight: .semibold, design: .rounded))
                    .foregroundStyle(labelColor)
                    .lineLimit(1)
            }

            Text(value)
                .font(.system(size: 17, weight: .bold, design: .rounded))
                .foregroundStyle(valueColor)
                .lineLimit(1)
                .minimumScaleFactor(0.65)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.horizontal, 10)
        .padding(.vertical, 9)
        .background(backgroundColor)
        .clipShape(RoundedRectangle(cornerRadius: 8, style: .continuous))
    }
}

struct WellWidgetBackground: View {
    let style: WellWidgetStyle

    var body: some View {
        Group {
            switch style {
            case .dark:
                LinearGradient(
                    colors: [
                        Color(red: 0.02, green: 0.06, blue: 0.10),
                        Color(red: 0.02, green: 0.22, blue: 0.28),
                        Color(red: 0.02, green: 0.39, blue: 0.48)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .overlay(
                    LinearGradient(
                        colors: [.white.opacity(0.12), .clear],
                        startPoint: .topLeading,
                        endPoint: .center
                    )
                )
            case .light:
                LinearGradient(
                    colors: [
                        .white,
                        Color(red: 0.91, green: 0.99, blue: 1.0),
                        Color(red: 0.80, green: 0.94, blue: 0.98)
                    ],
                    startPoint: .topLeading,
                    endPoint: .bottomTrailing
                )
                .overlay(
                    LinearGradient(
                        colors: [Color(red: 0.01, green: 0.57, blue: 0.81).opacity(0.12), .clear],
                        startPoint: .bottomTrailing,
                        endPoint: .center
                    )
                )
            }
        }
    }
}

extension View {
    @ViewBuilder
    func wellWidgetBackground(style: WellWidgetStyle) -> some View {
        if #available(iOS 17.0, *) {
            self.containerBackground(for: .widget) {
                WellWidgetBackground(style: style)
            }
        } else {
            self.background(WellWidgetBackground(style: style))
        }
    }
}

struct WellCheckHomeWidget: Widget {
    let kind = "WellCheckHomeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WellCheckProvider()) { entry in
            WellCheckHomeWidgetView(entry: entry, style: .dark)
        }
        .configurationDisplayName("WELL Check Dark")
        .description("See today's WELL Check snapshot in the dark style.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

struct WellCheckHomeLightWidget: Widget {
    let kind = "WellCheckHomeLightWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WellCheckProvider()) { entry in
            WellCheckHomeWidgetView(entry: entry, style: .light)
        }
        .configurationDisplayName("WELL Check Light")
        .description("See today's WELL Check snapshot in the light style.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@available(iOSApplicationExtension 16.1, *)
struct WellCheckInlineLockWidget: Widget {
    let kind = "WellCheckInlineLockWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WellCheckProvider()) { entry in
            Text("\(entry.areas) WELL · \(entry.reminder)")
                .widgetURL(URL(string: "wellcollective://well-check"))
        }
        .configurationDisplayName("WELL Inline")
        .description("A text-only Lock Screen reminder with no tile background.")
        .supportedFamilies([.accessoryInline])
    }
}

enum WellColor {
    static let sky = Color(red: 0.27, green: 0.78, blue: 0.94)
    static let alertBlue = Color(red: 0.02, green: 0.57, blue: 0.81)
    static let mint = Color(red: 0.24, green: 0.86, blue: 0.49)
    static let orange = Color(red: 1.0, green: 0.54, blue: 0.20)
    static let gold = Color(red: 1.0, green: 0.80, blue: 0.18)
}

@available(iOSApplicationExtension 16.1, *)
struct WellCheckProgressLockView: View {
    @Environment(\.widgetFamily) private var family
    let entry: WellCheckEntry

    private var areaValue: Double {
        let firstValue = entry.areas.split(separator: "/").first.map(String.init) ?? "0"
        return Double(firstValue) ?? 0
    }

    private var areaText: String {
        entry.areas.split(separator: "/").first.map(String.init) ?? "0"
    }

    var body: some View {
        Group {
            switch family {
            case .accessoryCircular:
                Gauge(value: areaValue, in: 0...6) {
                    Text("WELL")
                } currentValueLabel: {
                    Text(areaText)
            }
            .gaugeStyle(.accessoryCircular)
        default:
            VStack(alignment: .leading, spacing: 1) {
                Text("WELL Today")
                    .font(.caption2.bold())
                Text("\(entry.areas) areas · \(entry.points)")
                    .font(.caption.bold())
                Text("\(entry.sleep) sleep · \(entry.steps) steps")
                    .font(.caption2)
            }
            .lineLimit(1)
        }
    }
        .widgetURL(URL(string: "wellcollective://well-check"))
    }
}

@available(iOSApplicationExtension 16.1, *)
struct WellCheckReminderLockView: View {
    @Environment(\.widgetFamily) private var family
    let entry: WellCheckEntry

    private var isComplete: Bool {
        entry.areas.hasPrefix("6/")
    }

    var body: some View {
        Group {
            switch family {
            case .accessoryCircular:
                VStack(spacing: 2) {
                    Image(systemName: isComplete ? "checkmark" : "plus")
                        .font(.caption.bold())
                    Text(isComplete ? "DONE" : "LOG")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            default:
                VStack(alignment: .leading, spacing: 1) {
                    Text(isComplete ? "Today complete" : "WELL Reminder")
                        .font(.caption2.bold())
                    Text(entry.reminder)
                        .font(.caption.bold())
                    Text("\(entry.areas) areas logged")
                        .font(.caption2)
                }
                .lineLimit(1)
            }
        }
        .widgetURL(URL(string: "wellcollective://well-check"))
    }
}

@available(iOSApplicationExtension 16.1, *)
struct WellCheckAlertsLockView: View {
    @Environment(\.widgetFamily) private var family
    let entry: WellCheckEntry

    private var unreadNumber: Int {
        Int(entry.unreadCount) ?? 0
    }

    private var unreadText: String {
        unreadNumber > 99 ? "99+" : "\(unreadNumber)"
    }

    private var alertLabel: String {
        unreadNumber == 1 ? "1 new alert" : "\(unreadText) new alerts"
    }

    var body: some View {
        Group {
            switch family {
            case .accessoryCircular:
                VStack(spacing: 2) {
                    Image(systemName: unreadNumber > 0 ? "bell.fill" : "bell")
                        .font(.caption.bold())
                    Text(unreadText)
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
            default:
                VStack(alignment: .leading, spacing: 1) {
                    Text("WELL Alerts")
                        .font(.caption2.bold())
                    Text(unreadNumber > 0 ? alertLabel : "No new alerts")
                        .font(.caption.bold())
                    Text(unreadNumber > 0 ? "Tap to catch up" : entry.reminder)
                        .font(.caption2)
                }
                .lineLimit(1)
            }
        }
        .widgetURL(URL(string: "wellcollective://notifications"))
    }
}

@available(iOSApplicationExtension 16.1, *)
struct WellCheckProgressLockWidget: Widget {
    let kind = "WellCheckProgressLockWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WellCheckProvider()) { entry in
            WellCheckProgressLockView(entry: entry)
        }
        .configurationDisplayName("WELL Today")
        .description("Show areas, sleep, steps, and points on your Lock Screen.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular])
    }
}

@available(iOSApplicationExtension 16.1, *)
struct WellCheckReminderLockWidget: Widget {
    let kind = "WellCheckReminderLockWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WellCheckProvider()) { entry in
            WellCheckReminderLockView(entry: entry)
        }
        .configurationDisplayName("WELL Reminder")
        .description("Show the next thing to log today.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular])
    }
}

@available(iOSApplicationExtension 16.1, *)
struct WellCheckAlertsLockWidget: Widget {
    let kind = "WellCheckAlertsLockWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WellCheckProvider()) { entry in
            WellCheckAlertsLockView(entry: entry)
        }
        .configurationDisplayName("WELL Alerts")
        .description("Show unread WELL notifications.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular])
    }
}
