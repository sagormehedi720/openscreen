// @vitest-environment jsdom
// "None" in the background picker: the recording alone. Padding is what lets a background show,
// so picking "None" takes it to 0, and picking a wallpaper again brings the default back unless
// the user has set one by hand in the meantime.

import "@testing-library/jest-dom";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { I18nProvider } from "@/contexts/I18nContext";
import { LOCALE_STORAGE_KEY } from "@/i18n/config";
import { createEmptyDocument } from "@/lib/ai-edition/schema";
import { DEFAULT_EDITOR_SETTINGS } from "@/lib/ai-edition/store/editorSettings";
import { useProjectStore } from "@/lib/ai-edition/store/projectStore";
import { NO_WALLPAPER } from "@/lib/wallpaper";
import { VideoEffectsPane } from "./RightPanes";

function renderWith(legacyEditor: Record<string, unknown>) {
	const base = createEmptyDocument({ projectId: "project_no_bg", title: "No background" });
	useProjectStore.setState({
		projectId: base.project.id,
		document: { ...base, legacyEditor },
		revision: 1,
		status: "ready",
	});
	return render(
		<I18nProvider>
			<VideoEffectsPane />
		</I18nProvider>,
	);
}

const legacyEditor = () => useProjectStore.getState().document?.legacyEditor;
const noneSwatch = () => screen.getByRole("button", { name: "No background" });

beforeEach(() => {
	localStorage.clear();
	localStorage.setItem(LOCALE_STORAGE_KEY, "en");
});

afterEach(() => {
	cleanup();
	localStorage.clear();
	useProjectStore.getState().clear();
});

describe("no background", () => {
	it("drops the wallpaper and the padding, so the recording fills the frame", () => {
		renderWith({ wallpaper: "/wallpapers/wallpaper1.jpg", padding: 40 });
		fireEvent.click(noneSwatch());
		expect(legacyEditor()).toMatchObject({ wallpaper: NO_WALLPAPER, padding: 0 });
	});

	it("shows as picked, and leaves out the blur there is nothing to apply to", () => {
		renderWith({ wallpaper: NO_WALLPAPER, padding: 0 });
		expect(noneSwatch().className).toMatch(/isActive/);
		expect(screen.queryByRole("slider", { name: "Blur background" })).not.toBeInTheDocument();
	});

	it("brings the default padding back with the next wallpaper", () => {
		renderWith({ wallpaper: NO_WALLPAPER, padding: 0 });
		fireEvent.click(screen.getByRole("button", { name: /^Color #16171d$/ }));
		expect(legacyEditor()).toMatchObject({
			wallpaper: "#16171d",
			padding: DEFAULT_EDITOR_SETTINGS.padding,
		});
	});

	it("keeps a padding set by hand when a wallpaper comes back", () => {
		renderWith({ wallpaper: NO_WALLPAPER, padding: 12 });
		fireEvent.click(screen.getByRole("button", { name: /^Color #16171d$/ }));
		expect(legacyEditor()).toMatchObject({ wallpaper: "#16171d", padding: 12 });
	});

	it("leaves the padding alone between two wallpapers", () => {
		renderWith({ wallpaper: "#6b7280", padding: 0 });
		fireEvent.click(screen.getByRole("button", { name: /^Color #16171d$/ }));
		expect(legacyEditor()).toMatchObject({ wallpaper: "#16171d", padding: 0 });
	});
});
