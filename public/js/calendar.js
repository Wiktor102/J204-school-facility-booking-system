const calendar = document.querySelector(".calendar-view");
const bookingForm = document.getElementById("booking-form");

function toMinutes(time) {
	const [h, m] = time.split(":").map(Number);
	return h * 60 + m;
}

function minutesToTime(minutes) {
	const h = Math.floor(minutes / 60)
		.toString()
		.padStart(2, "0");
	const m = (minutes % 60).toString().padStart(2, "0");
	return `${h}:${m}`;
}

function overlaps(aStart, aEnd, bStart, bEnd) {
	const aS = toMinutes(aStart);
	const aE = toMinutes(aEnd);
	const bS = toMinutes(bStart);
	const bE = toMinutes(bEnd);
	return !(aE <= bS || bE <= aS);
}

function ensureModal() {
	let modal = document.querySelector(".booking-modal");
	if (!modal) {
		modal = document.createElement("div");
		modal.className = "booking-modal is-hidden";
		modal.innerHTML = `
      <div class="booking-modal__body">
        <p class="booking-modal__title">Nowa rezerwacja</p>
        <div class="booking-modal__form">
          <div class="form-group">
            <label>Data</label>
            <p class="booking-modal__date"></p>
          </div>
          <div class="form-group">
            <label for="modal-start-time">Godzina rozpoczęcia</label>
            <input type="time" id="modal-start-time" class="form-input" />
          </div>
          <div class="form-group">
            <label for="modal-duration">Czas trwania (minuty)</label>
            <input type="number" id="modal-duration" class="form-input" step="15" />
          </div>
          <p class="booking-modal__preview"></p>
          <p class="booking-modal__error is-hidden"></p>
        </div>
        <div class="booking-modal__actions">
          <button type="button" class="btn btn--ghost" data-dismiss>Anuluj</button>
          <button type="button" class="btn btn--primary" data-confirm>Rezerwuj</button>
        </div>
      </div>`;
		document.body.appendChild(modal);
		modal.querySelector("[data-dismiss]").addEventListener("click", () => {
			modal.classList.add("is-hidden");
		});
	}
	return modal;
}

if (calendar && bookingForm) {
	const modal = ensureModal();
	const startHour = parseInt(calendar.dataset.startHour, 10);
	const endHour = parseInt(calendar.dataset.endHour, 10);
	const minDuration = parseInt(calendar.dataset.minDuration, 10);
	const maxDuration = parseInt(calendar.dataset.maxDuration, 10);

	let pendingDate = null;
	let pendingEvents = [];
	let activeCompactEvent = null;

	const startTimeInput = modal.querySelector("#modal-start-time");
	const durationInput = modal.querySelector("#modal-duration");
	const previewEl = modal.querySelector(".booking-modal__preview");
	const errorEl = modal.querySelector(".booking-modal__error");
	const dateDisplay = modal.querySelector(".booking-modal__date");

	function updatePreview() {
		const startTime = startTimeInput.value;
		const duration = parseInt(durationInput.value, 10);

		errorEl.classList.add("is-hidden");
		errorEl.textContent = "";

		if (!startTime || !duration) {
			previewEl.textContent = "";
			return false;
		}

		const startMinutes = toMinutes(startTime);
		const endMinutes = startMinutes + duration;
		const endTime = minutesToTime(endMinutes);

		previewEl.textContent = `${startTime} - ${endTime}`;

		// Validation
		if (startMinutes < startHour * 60) {
			errorEl.textContent = `Rezerwacja nie może zaczynać się przed ${startHour}:00`;
			errorEl.classList.remove("is-hidden");
			return false;
		}

		if (endMinutes > endHour * 60) {
			errorEl.textContent = `Rezerwacja musi kończyć się do ${endHour}:00`;
			errorEl.classList.remove("is-hidden");
			return false;
		}

		if (duration < minDuration) {
			errorEl.textContent = `Minimalny czas trwania to ${minDuration} minut`;
			errorEl.classList.remove("is-hidden");
			return false;
		}

		if (duration > maxDuration) {
			errorEl.textContent = `Maksymalny czas trwania to ${maxDuration} minut`;
			errorEl.classList.remove("is-hidden");
			return false;
		}

		// Check for overlaps with existing events
		for (const event of pendingEvents) {
			if (overlaps(startTime, endTime, event.startTime, event.endTime)) {
				errorEl.textContent = "Ten termin koliduje z istniejącą rezerwacją";
				errorEl.classList.remove("is-hidden");
				return false;
			}
		}

		// Check if in the past
		const today = new Date();
		const todayStr = today.toISOString().slice(0, 10);
		const nowMinutes = today.getHours() * 60 + today.getMinutes();
		if (pendingDate < todayStr || (pendingDate === todayStr && startMinutes <= nowMinutes)) {
			errorEl.textContent = "Nie można rezerwować w przeszłości";
			errorEl.classList.remove("is-hidden");
			return false;
		}

		return true;
	}

	startTimeInput.addEventListener("input", updatePreview);
	durationInput.addEventListener("input", updatePreview);

	// Handle touch interactions for compact events
	document.addEventListener("touchstart", (e) => {
		const compactEvent = e.target.closest(".calendar-event--compact");
		if (!compactEvent) return;

		e.stopPropagation();

		// If this is a different event, deactivate the previous one
		if (activeCompactEvent && activeCompactEvent !== compactEvent) {
			activeCompactEvent.classList.remove("calendar-event--active");
		}

		// Toggle active state on the touched event
		if (compactEvent.classList.contains("calendar-event--active")) {
			// Second tap - deactivate
			compactEvent.classList.remove("calendar-event--active");
			activeCompactEvent = null;
		} else {
			// First tap - activate
			compactEvent.classList.add("calendar-event--active");
			activeCompactEvent = compactEvent;
		}
	});

	// Close active compact event when clicking outside
	document.addEventListener("click", (e) => {
		// Don't close if clicking on the compact event itself
		if (e.target.closest(".calendar-event--compact")) return;

		if (activeCompactEvent) {
			activeCompactEvent.classList.remove("calendar-event--active");
			activeCompactEvent = null;
		}
	});

	startTimeInput.addEventListener("input", updatePreview);
	durationInput.addEventListener("input", updatePreview);

	// Click on timeline to create booking
	document.querySelectorAll(".calendar-day__timeline").forEach((timeline) => {
		timeline.addEventListener("click", (e) => {
			// Don't trigger if clicking on an existing event
			if (e.target.closest(".calendar-event")) return;

			const dayEl = timeline.closest(".calendar-day");
			if (!dayEl) return;

			pendingDate = dayEl.dataset.date;
			try {
				pendingEvents = JSON.parse(dayEl.dataset.events || "[]");
			} catch (error) {
				console.error("Error parsing events:", error);
				pendingEvents = [];
			}

			// Calculate clicked time based on position
			const rect = timeline.getBoundingClientRect();
			const clickY = e.clientY - rect.top;
			const percentY = clickY / rect.height;
			const totalMinutes = (endHour - startHour) * 60;
			const clickedMinutes = startHour * 60 + Math.floor(percentY * totalMinutes);

			// Round to nearest 15 minutes
			const roundedMinutes = Math.round(clickedMinutes / 15) * 15;
			const clickedTime = minutesToTime(
				Math.max(startHour * 60, Math.min(roundedMinutes, endHour * 60 - minDuration))
			);

			dateDisplay.textContent = new Date(pendingDate).toLocaleDateString("pl-PL");
			startTimeInput.value = clickedTime;
			startTimeInput.min = minutesToTime(startHour * 60);
			startTimeInput.max = minutesToTime(endHour * 60 - minDuration);
			durationInput.value = minDuration;
			durationInput.min = minDuration;
			durationInput.max = maxDuration;

			updatePreview();
			modal.classList.remove("is-hidden");
		});
	});

	// Update compact/top classes based on pixel thresholds
	function updateCompactClasses() {
		const THRESHOLD_PX = 32;
		const TOP_THRESHOLD_PX = 40;
		document.querySelectorAll(".calendar-day__timeline").forEach((timeline) => {
			const timelineRect = timeline.getBoundingClientRect();
			timeline.querySelectorAll(".calendar-event").forEach((ev) => {
				const rect = ev.getBoundingClientRect();
				const height = rect.height;
				if (height < THRESHOLD_PX) {
					ev.classList.add("calendar-event--compact");
				} else {
					ev.classList.remove("calendar-event--compact");
				}

				const topFromTimeline = rect.top - timelineRect.top;
				if (topFromTimeline < TOP_THRESHOLD_PX) {
					ev.classList.add("calendar-event--top");
				} else {
					ev.classList.remove("calendar-event--top");
				}
			});
		});
	}

	// Run on load and on resize
	updateCompactClasses();
	window.addEventListener("resize", updateCompactClasses);

	modal.querySelector("[data-confirm]").addEventListener("click", async () => {
		if (!pendingDate) return;
		if (!updatePreview()) return;

		const startTime = startTimeInput.value;
		const duration = durationInput.value;

		bookingForm.elements.namedItem("bookingDate").value = pendingDate;
		bookingForm.elements.namedItem("startTime").value = startTime;
		bookingForm.elements.namedItem("duration").value = duration;

		const formData = new FormData(bookingForm);
		const payload = Object.fromEntries(formData.entries());
		const response = await fetch(bookingForm.action, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json"
			},
			body: JSON.stringify(payload)
		});

		if (response.ok) {
			window.location.reload();
			return;
		}

		let json = null;
		try {
			json = await response.json();
		} catch (e) {
			// ignore
		}

		if (response.status === 401) {
			window.location.href = "/login";
			return;
		}

		errorEl.textContent = json?.message ?? "Nie udało się utworzyć rezerwacji.";
		errorEl.classList.remove("is-hidden");
	});
}
