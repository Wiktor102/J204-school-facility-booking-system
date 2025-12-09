(function () {
	"use strict";

	const cancelButtons = document.querySelectorAll("[data-cancel]");

	cancelButtons.forEach((button) => {
		button.addEventListener("click", async (event) => {
			event.preventDefault();
			const bookingId = button.getAttribute("data-cancel");
			if (!bookingId) return;
			if (!confirm("Czy na pewno chcesz anulować tę rezerwację?")) {
				return;
			}

			const response = await fetch(`/bookings/${bookingId}`, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
					Accept: "application/json"
				},
				body: JSON.stringify({})
			});

			if (response.ok) {
				window.location.reload();
				return;
			}

			// try to parse JSON error
			let json = null;
			try {
				json = await response.json();
			} catch (e) {
				// ignore parse errors
			}

			// if not authenticated -> redirect to login
			if (response.status === 401) {
				window.location.href = "/login";
				return;
			}
			alert(json?.message ?? "Nie udało się anulować rezerwacji.");
		});
	});
})();
