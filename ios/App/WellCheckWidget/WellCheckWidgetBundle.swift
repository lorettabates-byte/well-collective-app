import WidgetKit
import SwiftUI

@main
struct WellCheckWidgetBundle: WidgetBundle {
    @WidgetBundleBuilder
    var body: some Widget {
        WellCheckHomeWidget()
        WellCheckHomeLightWidget()
        if #available(iOS 16.1, *) {
            WellCheckInlineLockWidget()
            WellCheckProgressLockWidget()
            WellCheckReminderLockWidget()
            WellCheckAlertsLockWidget()
        }
    }
}
