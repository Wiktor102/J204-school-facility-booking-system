(function () {
	"use strict";

	const toggleButtons = Array.from(document.querySelectorAll(".js-equipment-toggle"));
	const cancelButtons = Array.from(document.querySelectorAll(".js-booking-cancel"));
	const editButtons = Array.from(document.querySelectorAll(".js-equipment-edit"));
	const editModal = document.getElementById("editEquipmentModal");
	const cancelEditBtn = document.getElementById("cancelEdit");
	const saveEditBtn = document.getElementById("saveEdit");

	function validateOpeningHours(startHour, endHour) {
		const start = Number(startHour);
		const end = Number(endHour);

		if (isNaN(start) || isNaN(end)) {
			return "Godziny muszą być liczbami.";
		}

		if (start < 0) {
			return "Godzina otwarcia nie może być ujemna.";
		}

		if (end < 0) {
			return "Godzina zamknięcia nie może być ujemna.";
		}

		if (start > 23) {
			return "Godzina otwarcia nie może być większa niż 23.";
		}

		if (end > 23) {
			return "Godzina zamknięcia nie może być większa niż 23.";
		}

		if (start >= end) {
			return "Godzina otwarcia musi być wcześniejsza niż godzina zamknięcia.";
		}

		return null;
	}

	function validateDurationMinutes(minDuration, maxDuration) {
		const min = Number(minDuration);
		const max = Number(maxDuration);

		if (isNaN(min) || isNaN(max)) {
			return "Czasy rezerwacji muszą być liczbami.";
		}

		if (min < 1) {
			return "Minimalny czas rezerwacji musi być większy niż 0.";
		}

		if (max < 1) {
			return "Maksymalny czas rezerwacji musi być większy niż 0.";
		}

		if (min > max) {
			return "Minimalny czas nie może być większy niż maksymalny.";
		}

		return null;
	}

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

	if (editButtons.length && editModal) {
		editButtons.forEach((btn) => {
			btn.addEventListener("click", () => {
				const id = btn.dataset.id;
				document.getElementById("editId").value = id;
				document.getElementById("editName").value = btn.dataset.name;
				document.getElementById("editIconName").value = btn.dataset.iconName;
				document.getElementById("editAccentColor").value = btn.dataset.accentColor;
				document.getElementById("editDailyStartHour").value = btn.dataset.dailyStartHour;
				document.getElementById("editDailyEndHour").value = btn.dataset.dailyEndHour;
				document.getElementById("editMinDurationMinutes").value = btn.dataset.minDurationMinutes;
				document.getElementById("editMaxDurationMinutes").value = btn.dataset.maxDurationMinutes;

				editModal.showModal();
			});
		});

		if (cancelEditBtn) {
			cancelEditBtn.addEventListener("click", () => {
				editModal.close();
			});
		}

		if (saveEditBtn) {
			saveEditBtn.addEventListener("click", async (e) => {
				e.preventDefault();
				const id = document.getElementById("editId").value;
				const startHour = document.getElementById("editDailyStartHour").value;
				const endHour = document.getElementById("editDailyEndHour").value;
				const minDuration = document.getElementById("editMinDurationMinutes").value;
				const maxDuration = document.getElementById("editMaxDurationMinutes").value;

				// Validate opening hours
				const hoursError = validateOpeningHours(startHour, endHour);
				if (hoursError) {
					alert(hoursError);
					return;
				}

				// Validate duration
				const durationError = validateDurationMinutes(minDuration, maxDuration);
				if (durationError) {
					alert(durationError);
					return;
				}

				const data = {
					name: document.getElementById("editName").value,
					iconName: document.getElementById("editIconName").value,
					accentColor: document.getElementById("editAccentColor").value,
					dailyStartHour: startHour,
					dailyEndHour: endHour,
					minDurationMinutes: minDuration,
					maxDurationMinutes: maxDuration
				};

				try {
					const response = await fetch(`/admin/equipment/${id}`, {
						method: "PATCH",
						headers: {
							"Content-Type": "application/json",
							Accept: "application/json"
						},
						body: JSON.stringify(data)
					});

					if (!response.ok) {
						const errorText = await response.text();
						throw new Error(errorText || "Nie udało się zaktualizować sprzętu.");
					}

					window.location.reload();
				} catch (error) {
					console.error(error);
					alert(error instanceof Error ? error.message : "Nieznany błąd podczas aktualizacji.");
				}
			});
		}
	}
})();
