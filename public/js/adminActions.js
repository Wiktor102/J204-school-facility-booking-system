const toggleButtons = Array.from(document.querySelectorAll(".js-equipment-toggle"));
const cancelButtons = Array.from(document.querySelectorAll(".js-booking-cancel"));

async function toggleEquipment(button) {
	const equipmentId = button.dataset.equipmentId;
	const nextActive = button.dataset.nextActive === "true";
	if (!equipmentId) {
		return;
	}

	button.disabled = true;

	try {
		const response = await fetch(`/admin/equipment/${equipmentId}`, {
			method: "PATCH",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json"
			},
			body: JSON.stringify({ isActive: nextActive })
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(errorText || "Nie udało się zaktualizować sprzętu.");
		}

		const payload = await response.json();
		const isActive = Boolean(payload?.equipment?.isActive ?? nextActive);

		const row = button.closest("tr");
		if (row) {
			const badge = row.querySelector(".badge");
			if (badge) {
				badge.textContent = isActive ? "Aktywny" : "Wyłączony";
				badge.classList.toggle("badge--success", isActive);
				badge.classList.toggle("badge--muted", !isActive);
			}
		}

		button.dataset.nextActive = String(!isActive);
		button.textContent = isActive ? "Wyłącz" : "Włącz";
	} catch (error) {
		console.error(error);
		alert(error instanceof Error ? error.message : "Nieznany błąd podczas aktualizacji.");
	} finally {
		button.disabled = false;
	}
}

async function cancelBooking(button) {
	const bookingId = button.dataset.bookingId;
	if (!bookingId) {
		return;
	}

	const confirmCancel = window.confirm("Czy na pewno chcesz anulować tę rezerwację?");
	if (!confirmCancel) {
		return;
	}

	button.disabled = true;

	try {
		const response = await fetch(`/admin/bookings/${bookingId}`, {
			method: "DELETE",
			headers: {
				Accept: "application/json"
			}
		});

		if (!response.ok) {
			const errorText = await response.text();
			throw new Error(errorText || "Nie udało się anulować rezerwacji.");
		}

		await response.json();

		const row = button.closest("tr");
		if (row) {
			const badge = row.querySelector(".badge");
			if (badge) {
				badge.textContent = "Anulowana";
				badge.classList.remove("badge--success");
				badge.classList.add("badge--danger");
			}
		}

		button.remove();
	} catch (error) {
		console.error(error);
		alert(error instanceof Error ? error.message : "Nieznany błąd podczas anulowania.");
	} finally {
		button.disabled = false;
	}
}

if (toggleButtons.length) {
	toggleButtons.forEach((button) => {
		button.addEventListener("click", () => {
			toggleEquipment(button);
		});
	});
}

if (cancelButtons.length) {
	cancelButtons.forEach((button) => {
		button.addEventListener("click", () => {
			cancelBooking(button);
		});
	});
}
