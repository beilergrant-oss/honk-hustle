//
//  AdManager.swift
//  Honk Hustle
//
//  Handles the App Tracking Transparency prompt, starts the Google Mobile Ads SDK, and keeps one
//  rewarded video ad preloaded and ready to show at all times.
//
//  Setup required before this compiles and runs:
//   1. Add the Google Mobile Ads SDK to the Xcode project:
//        Swift Package Manager -> https://github.com/googleads/swift-package-manager-google-mobile-ads.git
//        (or CocoaPods: pod 'Google-Mobile-Ads-SDK')
//   2. In Info.plist add:
//        GADApplicationIdentifier        (String) - your AdMob app ID, e.g. ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY
//        NSUserTrackingUsageDescription  (String) - the text shown in the ATT system prompt
//        SKAdNetworkItems                (Array)  - Google's recommended SKAdNetwork ID list (see AdMob's
//                                                    "Update your SKAdNetworkItems" setup page)
//   3. Replace `rewardedAdUnitID` below with your real AdMob rewarded ad unit ID before shipping.
//      The one here is Google's public test unit ID and always serves a test ad - safe to leave in
//      during development, but App Review will reject a build that ships with it.
//   4. Call `AdManager.shared.start()` once, early in launch (e.g. `application(_:didFinishLaunchingWithOptions:)`
//      or your SwiftUI App's `.onAppear`), ideally after your first screen is already on screen so the
//      ATT system prompt doesn't collide with your own launch UI.
//
//  Note on SDK versions: Mobile Ads SDK 11+ renamed the "GAD"-prefixed classes used below
//  (GADMobileAds -> MobileAds, GADRewardedAd -> RewardedAd, GADRequest -> Request, etc). The GAD-prefixed
//  names used here still work as typealiases on recent 10.x/11.x releases; if your SDK version has
//  removed them, drop the "GAD" prefix throughout this file.
//

import UIKit
import AppTrackingTransparency
import GoogleMobileAds

/// Centralizes AdMob startup, the App Tracking Transparency prompt, and the rewarded-ad lifecycle
/// (load -> cache -> show -> auto-reload). Use `AdManager.shared` from anywhere in the app.
final class AdManager: NSObject {

    static let shared = AdManager()

    /// Google's public test rewarded ad unit ID. Swap for your real one before release.
    private let rewardedAdUnitID = "ca-app-pub-3940256099942544/1712485313"

    private var rewardedAd: GADRewardedAd?
    private var isLoadingAd = false
    private var rewardCompletion: ((Bool) -> Void)?
    private var pendingEarnedReward = false

    private override init() { super.init() }

    // MARK: - Startup

    /// Call once, early in app launch. Requests App Tracking Transparency first (iOS only shows the
    /// system prompt once per install), then starts the Mobile Ads SDK and preloads the first
    /// rewarded ad regardless of the ATT outcome - AdMob simply serves non-personalized ads when
    /// tracking wasn't authorized, so there's no reason to gate ad loading on it.
    func start() {
        requestTrackingAuthorization { [weak self] _ in
            self?.initializeMobileAds()
        }
    }

    /// Requests the ATT prompt if the user hasn't been asked yet. Safe to call more than once -
    /// iOS only shows the system dialog the first time; later calls resolve immediately with
    /// whatever status is already on file.
    func requestTrackingAuthorization(completion: @escaping (ATTrackingManager.AuthorizationStatus) -> Void) {
        guard ATTrackingManager.trackingAuthorizationStatus == .notDetermined else {
            completion(ATTrackingManager.trackingAuthorizationStatus)
            return
        }
        // A short delay keeps the system prompt from racing the app's own launch UI, which iOS can
        // silently drop if both try to present at once.
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            ATTrackingManager.requestTrackingAuthorization { status in
                DispatchQueue.main.async { completion(status) }
            }
        }
    }

    private func initializeMobileAds() {
        GADMobileAds.sharedInstance().start { [weak self] _ in
            self?.loadRewardedAd()
        }
    }

    // MARK: - Rewarded ad

    /// True once a rewarded ad is cached and ready to show immediately.
    var isRewardedAdReady: Bool { rewardedAd != nil }

    /// Fetches a rewarded ad and holds it in memory until it's shown. `showRewardedAd` triggers this
    /// again automatically once an ad finishes, so in normal use you only need to call it yourself
    /// right after `start()` (already handled) or to retry after a load failure.
    func loadRewardedAd() {
        guard !isLoadingAd, rewardedAd == nil else { return }
        isLoadingAd = true
        GADRewardedAd.load(withAdUnitID: rewardedAdUnitID, request: GADRequest()) { [weak self] ad, error in
            guard let self else { return }
            self.isLoadingAd = false
            if let error {
                print("AdManager: rewarded ad failed to load - \(error.localizedDescription)")
                // Back off before retrying so a persistent failure (no fill, offline) doesn't spin-load.
                DispatchQueue.main.asyncAfter(deadline: .now() + 30) { [weak self] in self?.loadRewardedAd() }
                return
            }
            self.rewardedAd = ad
            self.rewardedAd?.fullScreenContentDelegate = self
        }
    }

    /// Presents the cached rewarded ad from `viewController`. `completion` fires exactly once with
    /// `true` if the player watched far enough to earn the reward, or `false` if they closed early,
    /// presentation failed, or no ad was ready. Either way a fresh ad starts preloading immediately
    /// so the next request has one cached.
    func showRewardedAd(from viewController: UIViewController, completion: @escaping (Bool) -> Void) {
        guard let ad = rewardedAd else {
            completion(false)
            loadRewardedAd()
            return
        }
        rewardCompletion = completion
        pendingEarnedReward = false
        ad.present(fromRootViewController: viewController) { [weak self] in
            // Fires when the player crosses the reward threshold (usually watching to the end).
            self?.pendingEarnedReward = true
        }
    }
}

// MARK: - GADFullScreenContentDelegate

extension AdManager: GADFullScreenContentDelegate {
    func adDidDismissFullScreenContent(_ ad: GADFullScreenPresentingAd) {
        rewardedAd = nil
        rewardCompletion?(pendingEarnedReward)
        rewardCompletion = nil
        pendingEarnedReward = false
        loadRewardedAd() // keep one warm for next time
    }

    func ad(_ ad: GADFullScreenPresentingAd, didFailToPresentFullScreenContentWithError error: Error) {
        print("AdManager: rewarded ad failed to present - \(error.localizedDescription)")
        rewardedAd = nil
        rewardCompletion?(false)
        rewardCompletion = nil
        pendingEarnedReward = false
        loadRewardedAd()
    }
}
