import AVFoundation
import Capacitor
import Foundation
import MediaPlayer

// Bridges the web MediaSession metadata to the iOS lock screen / Control Center
// via MPNowPlayingInfoCenter. Without this, WKWebView does not forward artwork
// to the system-level now-playing UI.
//
// Also observes AVAudioSession interruption notifications (phone calls, Siri,
// other audio taking focus) and fires interruptionBegan / interruptionEnded
// events to the JS layer so MusicPlayerContext can pause and resume correctly.
@objc(NowPlayingPlugin)
public class NowPlayingPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "NowPlayingPlugin"
    public let jsName = "NowPlaying"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "setTrack", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "setPlaybackState", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateElapsed", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "clear", returnType: CAPPluginReturnPromise),
    ]

    // Cache the last artwork URL so we don't re-fetch on every play/pause toggle
    private var cachedArtworkUrl: String?
    private var cachedArtwork: MPMediaItemArtwork?

    public override func load() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleAudioInterruption(_:)),
            name: AVAudioSession.interruptionNotification,
            object: AVAudioSession.sharedInstance()
        )

        // Enable lock-screen / Control Center scrubbing. When the user drags
        // the playhead, fire a "seekTo" event so JS can update the audio element.
        let commandCenter = MPRemoteCommandCenter.shared()
        commandCenter.changePlaybackPositionCommand.isEnabled = true
        commandCenter.changePlaybackPositionCommand.addTarget { [weak self] event in
            guard let posEvent = event as? MPChangePlaybackPositionCommandEvent else {
                return .commandFailed
            }
            self?.notifyListeners("seekTo", data: ["position": posEvent.positionTime])
            return .success
        }
    }

    deinit {
        NotificationCenter.default.removeObserver(self)
    }

    // Called by iOS when audio is interrupted (phone call begins, Siri activates,
    // another app takes audio focus) or when the interruption ends.
    @objc private func handleAudioInterruption(_ notification: Notification) {
        guard
            let info = notification.userInfo,
            let typeValue = info[AVAudioSessionInterruptionTypeKey] as? UInt,
            let type = AVAudioSession.InterruptionType(rawValue: typeValue)
        else { return }

        if type == .began {
            // Phone call / Siri started — tell JS so it can update its "was playing" flag
            notifyListeners("interruptionBegan", data: [:])
        } else if type == .ended {
            // Interruption over — check whether iOS recommends we resume
            var shouldResume = false
            if let optionsValue = info[AVAudioSessionInterruptionOptionKey] as? UInt {
                let options = AVAudioSession.InterruptionOptions(rawValue: optionsValue)
                shouldResume = options.contains(.shouldResume)
            }
            // Re-activate the audio session after a call (iOS deactivates it)
            try? AVAudioSession.sharedInstance().setActive(true)
            notifyListeners("interruptionEnded", data: ["shouldResume": shouldResume])
        }
    }

    @objc func setTrack(_ call: CAPPluginCall) {
        let title = call.getString("title") ?? ""
        let artist = call.getString("artist") ?? "WELL Collective"
        let artworkUrl = call.getString("artworkUrl") ?? ""
        let duration = call.getDouble("duration") ?? 0

        var info: [String: Any] = [
            MPMediaItemPropertyTitle: title,
            MPMediaItemPropertyArtist: artist,
            MPNowPlayingInfoPropertyMediaType: MPNowPlayingInfoMediaType.audio.rawValue,
            MPMediaItemPropertyPlaybackDuration: duration,
            MPNowPlayingInfoPropertyPlaybackRate: 1.0,
        ]

        if artworkUrl.isEmpty {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info
            call.resolve()
            return
        }

        // Reuse cached artwork if the URL hasn't changed
        if artworkUrl == cachedArtworkUrl, let cached = cachedArtwork {
            info[MPMediaItemPropertyArtwork] = cached
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info
            call.resolve()
            return
        }

        guard let url = URL(string: artworkUrl) else {
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info
            call.resolve()
            return
        }

        URLSession.shared.dataTask(with: url) { [weak self] data, _, _ in
            if let data = data, let image = UIImage(data: data) {
                let artwork = MPMediaItemArtwork(boundsSize: image.size) { _ in image }
                self?.cachedArtworkUrl = artworkUrl
                self?.cachedArtwork = artwork
                info[MPMediaItemPropertyArtwork] = artwork
            }
            MPNowPlayingInfoCenter.default().nowPlayingInfo = info
        }.resume()

        call.resolve()
    }

    @objc func setPlaybackState(_ call: CAPPluginCall) {
        let isPlaying = call.getBool("isPlaying") ?? false
        let currentTime = call.getDouble("currentTime") ?? -1
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPNowPlayingInfoPropertyPlaybackRate] = isPlaying ? 1.0 : 0.0
        if currentTime >= 0 {
            info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
        }
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
        call.resolve()
    }

    // Called periodically from JS (every ~5 s) while playing so the lock-screen
    // scrub bar stays accurate. iOS auto-advances the displayed position using
    // playbackRate, but needs an anchor point to start from.
    @objc func updateElapsed(_ call: CAPPluginCall) {
        let currentTime = call.getDouble("currentTime") ?? 0
        var info = MPNowPlayingInfoCenter.default().nowPlayingInfo ?? [:]
        info[MPNowPlayingInfoPropertyElapsedPlaybackTime] = currentTime
        info[MPNowPlayingInfoPropertyPlaybackRate] = 1.0
        MPNowPlayingInfoCenter.default().nowPlayingInfo = info
        call.resolve()
    }

    @objc func clear(_ call: CAPPluginCall) {
        MPNowPlayingInfoCenter.default().nowPlayingInfo = nil
        cachedArtworkUrl = nil
        cachedArtwork = nil
        call.resolve()
    }
}
