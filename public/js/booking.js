const cancelButtons = document.querySelectorAll("[data-cancel]");

cancelButtons.forEach((button) => {
	button.addEventListener("click", async (event) => {
		event.preventDefault();
		const bookingId = button.getAttribute("data-cancel");
		if (!bookingId) {
			return;
		}
		if (!confirm("Czy na pewno chcesz anulować tę rezerwację?")) {
			return;
		}
		const response = await fetch(`/bookings/${bookingId}`, {
			method: "DELETE",
			headers: {
				"Content-Type": "application/json",
				"X-Requested-With": "XMLHttpRequest"
			},
			body: JSON.stringify({})
		});
		if (response.ok) {
			window.location.reload();
		} else {
			alert("Nie udało się anulować rezerwacji.");
		}
	});
});
