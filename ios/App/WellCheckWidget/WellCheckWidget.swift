import WidgetKit
import SwiftUI

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
            updatedAt: "Open WELL Check"
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
            points: defaults?.string(forKey: "points") ?? "--",
            areas: defaults?.string(forKey: "areas") ?? "--",
            sleep: defaults?.string(forKey: "sleep") ?? "--",
            energyIn: defaults?.string(forKey: "energyIn") ?? "In --",
            energyOut: defaults?.string(forKey: "energyOut") ?? "Out --",
            steps: defaults?.string(forKey: "steps") ?? "--",
            updatedAt: defaults?.string(forKey: "updatedAt") ?? "Tap to open"
        )
    }
}

struct WellCheckHomeWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: WellCheckEntry

    var body: some View {
        ZStack {
            Color(red: 0.05, green: 0.09, blue: 0.15)
            VStack(alignment: .leading, spacing: family == .systemSmall ? 8 : 10) {
                HStack {
                    Text("WELL Check")
                        .font(.headline)
                        .foregroundStyle(.white)
                    Spacer()
                    Text(entry.points)
                        .font(.caption.bold())
                        .foregroundStyle(Color(red: 0.98, green: 0.80, blue: 0.08))
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.white.opacity(0.08), in: Capsule())
                }

                HStack(spacing: 8) {
                    StatTile(label: "Areas", value: entry.areas, color: Color(red: 0.52, green: 0.85, blue: 0.99))
                    StatTile(label: "Sleep", value: entry.sleep, color: Color(red: 0.77, green: 0.71, blue: 0.99))
                    if family != .systemSmall {
                        StatTile(label: "Steps", value: entry.steps, color: Color(red: 0.98, green: 0.80, blue: 0.08))
                    }
                }

                if family != .systemSmall {
                    HStack {
                        Text(entry.energyOut)
                            .foregroundStyle(Color(red: 0.99, green: 0.73, blue: 0.45))
                        Spacer()
                        Text(entry.energyIn)
                            .foregroundStyle(Color(red: 0.43, green: 0.91, blue: 0.72))
                    }
                    .font(.caption2.bold())
                }

                Text(entry.updatedAt)
                    .font(.caption2)
                    .foregroundStyle(Color(red: 0.55, green: 0.64, blue: 0.74))
                    .lineLimit(1)
            }
            .padding()
        }
        .widgetURL(URL(string: "wellcollective://well-check"))
    }
}

struct StatTile: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(spacing: 3) {
            Text(value)
                .font(.caption.bold())
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
            Text(label)
                .font(.caption2.bold())
                .foregroundStyle(Color(red: 0.55, green: 0.64, blue: 0.74))
        }
        .frame(maxWidth: .infinity)
        .padding(.vertical, 8)
        .background(Color.white.opacity(0.06), in: RoundedRectangle(cornerRadius: 12))
    }
}

struct WellCheckHomeWidget: Widget {
    let kind = "WellCheckHomeWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WellCheckProvider()) { entry in
            WellCheckHomeWidgetView(entry: entry)
        }
        .configurationDisplayName("WELL Check")
        .description("See today's WELL Check snapshot.")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@available(iOSApplicationExtension 16.0, *)
struct WellCheckLockWidgetView: View {
    @Environment(\.widgetFamily) private var family
    let entry: WellCheckEntry

    private var areaValue: Double {
        let firstValue = entry.areas.split(separator: "/").first.map(String.init) ?? "0"
        return Double(firstValue) ?? 0
    }

    var body: some View {
        switch family {
        case .accessoryCircular:
            Gauge(value: areaValue, in: 0...6) {
                Text("WELL")
            }
            .gaugeStyle(.accessoryCircular)
        default:
            VStack(alignment: .leading, spacing: 2) {
                Text("WELL Check")
                    .font(.caption.bold())
                Text("\(entry.areas) areas • \(entry.sleep) sleep")
                    .font(.caption2)
                Text(entry.points)
                    .font(.caption2.bold())
            }
        }
    }
}

@available(iOSApplicationExtension 16.0, *)
struct WellCheckLockWidget: Widget {
    let kind = "WellCheckLockWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: WellCheckProvider()) { entry in
            WellCheckLockWidgetView(entry: entry)
        }
        .configurationDisplayName("WELL Check")
        .description("Pin today's WELL Check to your Lock Screen.")
        .supportedFamilies([.accessoryCircular, .accessoryRectangular])
    }
}
