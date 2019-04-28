"use strict";

(function () {

	const MENU_ID_PREFIX = "mnuRCT-";
	const DEFAULT_ICON = "icons/default.svg";			//"moz-icon://.url?size=16";
	const MAX_MENU_ITEMS_WITHOUT_PARENT_COUNT = 5;


	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	// Add Events Listeners

	// Browser action click
	browser.browserAction.onClicked.addListener(() => {
		reopenRecentlyClosed();
	});

	// keyboard command
	browser.commands.onCommand.addListener((command) => {
		if (command === "kb-reopen-recently-closed") {
			reopenRecentlyClosed();
		}
	});

	// Browser action show context menu (right click)
	browser.menus.onShown.addListener(() => {
		createBrowserActionContextMenu();
	});

	// context menu item
	browser.menus.onClicked.addListener((info) => {
		if (info.menuItemId.startsWith(MENU_ID_PREFIX)) {
			browser.sessions.restore(info.menuItemId.split("-")[2]);
		}
	});

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	function reopenRecentlyClosed() {
		browser.sessions.getRecentlyClosed({ maxResults: 1 }).then((sessions) => {
			if (sessions.length > 0) {
				browser.sessions.restore(!!sessions[0].tab ? sessions[0].tab.sessionId : sessions[0].window.sessionId);
			}
		});
	}

	//////////////////////////////////////////////////////////////////////////////////////////////////////////
	function createBrowserActionContextMenu() {

		let removing = browser.menus.removeAll();
		let gettingClosed = browser.sessions.getRecentlyClosed({ maxResults: browser.sessions.MAX_SESSION_RESULTS });

		removing.then(() => {
			gettingClosed.then((sessions) => {

				let subMenuId = undefined;
				let sessionInfo, menuItemId, menuItemTitle, menuItemIcon;

				for (let idx=0, len=sessions.length; idx<len; idx++) {

					if (idx === MAX_MENU_ITEMS_WITHOUT_PARENT_COUNT) {

						subMenuId = browser.menus.create({
							id: MENU_ID_PREFIX + "subMenu",
							title: "More Recently Closed",
							icons: { 16: "icons/recentlyClosed.svg" },
							contexts: ["browser_action"],
						});
					}

					sessionInfo = sessions[idx];
					menuItemId = MENU_ID_PREFIX + idx + "-";
					menuItemTitle = (idx+1).toString() + ". ";

					if (!!sessionInfo.tab) {
						menuItemId += sessionInfo.tab.sessionId;
						menuItemTitle += "[Tab] " + sessionInfo.tab.title;
						menuItemIcon = sessionInfo.tab.favIconUrl || DEFAULT_ICON;
					} else {
						menuItemId += sessionInfo.window.sessionId;
						menuItemTitle += "[Win] " + sessionInfo.window.tabs[0].title;
						menuItemIcon = sessionInfo.window.tabs[0].favIconUrl || DEFAULT_ICON;
					}

					browser.menus.create({
						id: menuItemId,
						parentId: subMenuId,
						title: menuItemTitle,
						icons: { 16: menuItemIcon.toString() },
						contexts: ["browser_action"],
					});
				}
				browser.menus.refresh();
			});
		});
	}

})();
