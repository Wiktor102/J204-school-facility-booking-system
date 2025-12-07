const calendar = document.querySelector(".calendar-view");
const durationPicker = document.getElementById("duration-picker");
const bookingForm = document.getElementById("booking-form");

function ensureModal() {
	let modal = document.querySelector(".booking-modal");
	if (!modal) {
		modal = document.createElement("div");
		modal.className = "booking-modal is-hidden";
		modal.innerHTML = `
      <div class="booking-modal__body">
        <p class="booking-modal__title">Potwierdź rezerwację</p>
        <p class="booking-modal__slot"></p>
        <div class="booking-modal__actions">
          <button type="button" class="btn btn--ghost" data-dismiss>Porzuć</button>
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
	let pendingSlot = null;

	calendar.addEventListener("click", (event) => {
		const slotButton = event.target.closest(".slot--available");
		if (!slotButton) {
			return;
		}
		const date = slotButton.getAttribute("data-date");
		const start = slotButton.getAttribute("data-start");
		pendingSlot = { date, start };
		const display = modal.querySelector(".booking-modal__slot");
		display.textContent = `${new Date(date).toLocaleDateString("pl-PL")} • ${start}`;
		modal.classList.remove("is-hidden");
	});

	modal.querySelector("[data-confirm]").addEventListener("click", async () => {
		if (!pendingSlot) {
			return;
		}
		const duration = durationPicker ? durationPicker.value : "60";
		bookingForm.elements.namedItem("bookingDate").value = pendingSlot.date;
		bookingForm.elements.namedItem("startTime").value = pendingSlot.start;
		bookingForm.elements.namedItem("duration").value = duration;

		const formData = new FormData(bookingForm);
		const payload = Object.fromEntries(formData.entries());
		const response = await fetch(bookingForm.action, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				"X-Requested-With": "XMLHttpRequest"
			},
			body: JSON.stringify(payload)
		});
		if (response.ok) {
			window.location.href = "/my-bookings";
		} else {
			alert("Nie udało się utworzyć rezerwacji.");
		}
	});
}
