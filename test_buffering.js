// Test system buforowania obrazów - uruchom w konsoli przeglądarki

async function testImageBuffering() {
  console.log("🧪 Test systemu buforowania obrazów...");

  // Import funkcji (jeśli potrzebne)
  const { loadImageWithBuffers, getBufferedImage, clearImageBuffers } =
    await import("./boardGameHelpers.js");

  // Wyczyść poprzednie bufory
  clearImageBuffers();

  // Test 1: Załaduj obraz z buforami
  console.log("📥 Ładowanie obrazu z automatycznym buforowaniem...");
  const testImagePath = "./assets/kodowanie_dla_najmlodszych/1.png";
  const img = await loadImageWithBuffers(testImagePath);

  if (img) {
    console.log("✅ Obraz załadowany:", img.width, "x", img.height);

    // Test 2: Sprawdź bufory różnych rozmiarów
    const testSizes = [75, 80, 100, 48];
    testSizes.forEach((size) => {
      const buffer = getBufferedImage(testImagePath, size);
      if (buffer) {
        console.log(
          `✅ Bufor ${size}px dostępny:`,
          buffer.width,
          "x",
          buffer.height
        );
      } else {
        console.log(`❌ Bufor ${size}px niedostępny`);
      }
    });

    // Test 3: Sprawdź czy nowy rozmiar tworzy bufor na żądanie
    console.log("🔄 Test tworzenia bufora na żądanie (120px)...");
    const customBuffer = getBufferedImage(testImagePath, 120);
    if (customBuffer) {
      console.log(
        "✅ Nowy bufor 120px utworzony:",
        customBuffer.width,
        "x",
        customBuffer.height
      );
    }

    console.log("🎉 Wszystkie testy przeszły pomyślnie!");
  } else {
    console.log("❌ Nie udało się załadować obrazu testowego");
  }
}

// Użycie:
// testImageBuffering();
