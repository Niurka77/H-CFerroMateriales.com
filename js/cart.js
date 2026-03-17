// Global variables
let cart = []
let currentDocumentType = "ruc"
let isSearching = false
let phoneValidation = null

// Phone validation patterns
const phonePatterns = {
  PE: { min: 9, max: 9, name: "Perú" },
  US: { min: 10, max: 10, name: "Estados Unidos" },
  MX: { min: 10, max: 10, name: "México" },
  CO: { min: 10, max: 10, name: "Colombia" },
  AR: { min: 10, max: 11, name: "Argentina" },
  CL: { min: 9, max: 9, name: "Chile" },
  ES: { min: 9, max: 9, name: "España" },
}

// Initialize page
document.addEventListener("DOMContentLoaded", () => {
  loadCart()
  setupEventListeners()
  initializeDocumentType()
  loadSavedFormData()
  setupPhoneValidation()
})

// Initialize document type
function initializeDocumentType() {
  const savedType = localStorage.getItem("documentType") || "ruc"
  document.getElementById(savedType + "Radio").checked = true
  handleDocumentTypeChange()
}

// Setup event listeners
function setupEventListeners() {
  // Auto-save form data
  ;["documentNumber", "clientName", "clientAddress", "phoneNumber"].forEach((id) => {
    const element = document.getElementById(id)
    if (element) {
      element.addEventListener("input", saveFormData)
    }
  })

  // Custom radio button styling
  document.querySelectorAll('input[name="documentType"]').forEach((radio) => {
    radio.addEventListener("change", () => {
      document.querySelectorAll('input[name="documentType"]').forEach((r) => {
        const dot = r.parentElement.querySelector(".w-2")
        if (r.checked) {
          dot.classList.remove("hidden")
        } else {
          dot.classList.add("hidden")
        }
      })
    })
  })

  // Toggle switch styling
  const toggle = document.getElementById("newEntryToggle")
  const dot = toggle.parentElement.querySelector(".dot")
  toggle.addEventListener("change", function () {
    if (this.checked) {
      dot.style.transform = "translateX(100%)"
      dot.style.backgroundColor = "#FF8C00"
    } else {
      dot.style.transform = "translateX(0%)"
      dot.style.backgroundColor = "white"
    }
  })
}

// Setup phone validation
function setupPhoneValidation() {
  const phoneInput = document.getElementById("phoneNumber")
  const countrySelect = document.getElementById("countryCode")

  phoneInput.addEventListener("input", function () {
    validatePhoneNumber(this)
  })

  countrySelect.addEventListener("change", () => {
    validatePhoneNumber(phoneInput)
  })
}

// Handle new entry toggle
function handleNewEntry() {
  const isNewEntry = document.getElementById("newEntryToggle").checked
  if (isNewEntry) {
    // Clear all form data
    clearFormData()
    showNotification("Datos del cliente limpiados para nuevo ingreso", "info")
  } else {
    // Load saved data
    loadSavedFormData()
    showNotification("Datos del cliente restaurados", "info")
  }
}

// Clear form data
function clearFormData() {
  document.getElementById("documentNumber").value = ""
  document.getElementById("clientName").value = ""
  document.getElementById("clientAddress").value = ""
  document.getElementById("phoneNumber").value = ""

  // Clear localStorage
  ;["documentNumber", "clientName", "clientAddress", "phoneNumber"].forEach((key) => {
    localStorage.removeItem(key)
  })

  // Reset validation states
  hideError("documentError")
  hideError("phoneError")
  hideSuccess("documentSuccess")
  hideSuccess("phoneSuccess")
}

// Load saved form data
function loadSavedFormData() {
  ;["documentNumber", "clientName", "clientAddress", "phoneNumber"].forEach((id) => {
    const element = document.getElementById(id)
    const savedValue = localStorage.getItem(id)
    if (element && savedValue) {
      element.value = savedValue
    }
  })
}

// Handle document type change
function handleDocumentTypeChange() {
  const rucRadio = document.getElementById("rucRadio")
  const dniRadio = document.getElementById("dniRadio")
  const documentLabel = document.getElementById("documentLabel")
  const nameLabel = document.getElementById("nameLabel")
  const addressField = document.getElementById("addressField")
  const documentNumber = document.getElementById("documentNumber")

  if (rucRadio.checked) {
    currentDocumentType = "ruc"
    documentLabel.textContent = "RUC"
    nameLabel.textContent = "Razón Social"
    addressField.classList.remove("hidden")
    documentNumber.placeholder = "Ingresa el RUC (11 dígitos)"
    documentNumber.maxLength = 11
  } else if (dniRadio.checked) {
    currentDocumentType = "dni"
    documentLabel.textContent = "DNI"
    nameLabel.textContent = "Nombres y Apellidos"
    addressField.classList.add("hidden")
    documentNumber.placeholder = "Ingresa el DNI (8 dígitos)"
    documentNumber.maxLength = 8
  }

  // Clear previous data when changing type
  documentNumber.value = ""
  document.getElementById("clientName").value = ""
  document.getElementById("clientAddress").value = ""

  // Save document type preference
  localStorage.setItem("documentType", currentDocumentType)

  // Reset validation
  hideError("documentError")
  hideSuccess("documentSuccess")
  updateSearchButton()
}

// Validate document number
function validateDocumentNumber(input) {
  const value = input.value

  // Only allow numbers
  const numbersOnly = value.replace(/[^0-9]/g, "")
  if (value !== numbersOnly) {
    input.value = numbersOnly
  }

  const documentError = document.getElementById("documentError")
  const searchButton = document.getElementById("searchButton")

  hideError("documentError")
  hideSuccess("documentSuccess")

  if (currentDocumentType === "ruc") {
    if (numbersOnly.length > 0 && numbersOnly.length !== 11) {
      showError("documentError", "El RUC debe tener exactamente 11 dígitos")
      searchButton.disabled = true
    } else if (numbersOnly.length === 11) {
      if (!isValidRUC(numbersOnly)) {
        showError("documentError", "El RUC ingresado no es válido")
        searchButton.disabled = true
      } else {
        searchButton.disabled = false
      }
    } else {
      searchButton.disabled = true
    }
  } else if (currentDocumentType === "dni") {
    if (numbersOnly.length > 0 && numbersOnly.length !== 8) {
      showError("documentError", "El DNI debe tener exactamente 8 dígitos")
      searchButton.disabled = true
    } else if (numbersOnly.length === 8) {
      if (!isValidDNI(numbersOnly)) {
        showError("documentError", "El DNI ingresado no es válido")
        searchButton.disabled = true
      } else {
        searchButton.disabled = false
      }
    } else {
      searchButton.disabled = true
    }
  }

  updateSearchButton()
}

// Validate phone number
function validatePhoneNumber(input) {
  const value = input.value
  const countryCode = document.getElementById("countryCode").value

  // Only allow numbers
  const numbersOnly = value.replace(/[^0-9]/g, "")
  if (value !== numbersOnly) {
    input.value = numbersOnly
  }

  hideError("phoneError")
  hideSuccess("phoneSuccess")

  if (numbersOnly.length > 0) {
    const pattern = phonePatterns[countryCode]
    const isValid = numbersOnly.length >= pattern.min && numbersOnly.length <= pattern.max

    if (isValid) {
      const dialCode = document.getElementById("countryCode").selectedOptions[0].getAttribute("data-dial")
      const internationalNumber = `+${dialCode}${numbersOnly}`
      showSuccess("phoneSuccess", `✓ ${internationalNumber}`)
      phoneValidation = {
        isValid: true,
        country: pattern.name,
        internationalNumber: internationalNumber,
      }
    } else {
      showError("phoneError", `Número inválido para ${pattern.name}`)
      phoneValidation = {
        isValid: false,
        country: pattern.name,
      }
    }
  } else {
    phoneValidation = null
  }
}

// Validate RUC
function isValidRUC(ruc) {
  if (ruc.length !== 11) return false

  // RUC validation algorithm for Peru
  const factors = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
  let sum = 0

  for (let i = 0; i < 10; i++) {
    sum += Number.parseInt(ruc[i]) * factors[i]
  }

  const remainder = sum % 11
  const checkDigit = remainder < 2 ? remainder : 11 - remainder

  return checkDigit === Number.parseInt(ruc[10])
}

// Validate DNI
function isValidDNI(dni) {
  if (dni.length !== 8) return false

  // Basic DNI validation for Peru
  const firstDigit = Number.parseInt(dni[0])
  return firstDigit >= 0 && firstDigit <= 9
}

// Update search button state
function updateSearchButton() {
  const searchButton = document.getElementById("searchButton")
  const documentNumber = document.getElementById("documentNumber").value

  if (isSearching) {
    searchButton.innerHTML = '<i class="fas fa-spinner animate-spin text-sm"></i>'
    searchButton.disabled = true
  } else {
    searchButton.innerHTML = '<i class="fas fa-search text-sm"></i>'
    searchButton.disabled =
      documentNumber.length === 0 ||
      (currentDocumentType === "ruc" && documentNumber.length !== 11) ||
      (currentDocumentType === "dni" && documentNumber.length !== 8)
  }
}

// Search document
async function searchDocument() {
  const documentNumber = document.getElementById("documentNumber").value

  if (!documentNumber || isSearching) return

  if (
    (currentDocumentType === "ruc" && documentNumber.length !== 11) ||
    (currentDocumentType === "dni" && documentNumber.length !== 8)
  ) {
    showError("documentError", "Ingrese un número válido antes de buscar")
    return
  }

  isSearching = true
  updateSearchButton()

  // Show loading indicators
  document.getElementById("loadingName").classList.remove("hidden")

  try {
    const response = await fetch("api/search-document.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: `tipo=${currentDocumentType}&numero=${documentNumber}`,
    })

    const data = await response.json()

    if (data.code === "200") {
      // Fill form with retrieved data
      let fullName = ""
      if (currentDocumentType === "dni") {
        fullName = `${data.nombres || ""} ${data.apellido_paterno || ""} ${data.apellido_materno || ""}`.trim()
      } else {
        fullName = data.razon_social || ""
      }

      document.getElementById("clientName").value = fullName

      if (currentDocumentType === "ruc" && data.direccion) {
        document.getElementById("clientAddress").value = data.direccion
      }

      showSuccess("documentSuccess", "Datos encontrados y completados automáticamente")

      // Save data
      saveFormData()

      showNotification("Información del cliente cargada correctamente", "success")
    } else {
      showError("documentError", data.mensaje || "No se encontraron datos para este documento")
      showNotification("No se pudo obtener la información del documento", "warning")
    }
  } catch (error) {
    console.error("Error searching document:", error)
    showError("documentError", "Error al consultar el documento. Inténtelo nuevamente.")
    showNotification("Error de conexión al consultar el documento", "error")
  } finally {
    isSearching = false
    updateSearchButton()
    document.getElementById("loadingName").classList.add("hidden")
  }
}

// Show error message
function showError(elementId, message) {
  const element = document.getElementById(elementId)
  element.innerHTML = `<i class="fas fa-exclamation-triangle mr-1"></i>${message}`
  element.classList.remove("hidden")
}

// Hide error message
function hideError(elementId) {
  const element = document.getElementById(elementId)
  element.classList.add("hidden")
}

// Show success message
function showSuccess(elementId, message) {
  const element = document.getElementById(elementId)
  element.innerHTML = `<i class="fas fa-check-circle mr-1"></i>${message}`
  element.classList.remove("hidden")
}

// Hide success message
function hideSuccess(elementId) {
  const element = document.getElementById(elementId)
  element.classList.add("hidden")
}

// Save form data to localStorage
function saveFormData() {
  if (!document.getElementById("newEntryToggle").checked) {
    ;["documentNumber", "clientName", "clientAddress", "phoneNumber"].forEach((id) => {
      const element = document.getElementById(id)
      if (element) {
        localStorage.setItem(id, element.value)
      }
    })
  }
}

// Load cart from localStorage
function loadCart() {
  cart = JSON.parse(localStorage.getItem("cart")) || []

  // Add sample products if cart is empty
  if (cart.length === 0) {
    cart = [
      { id: "1", name: "Arena Gruesa", price: 45.0, quantity: 15 },
      { id: "2", name: "Piedra Chancada 1/2", price: 55.0, quantity: 10 },
      { id: "3", name: "Arena Fina", price: 40.0, quantity: 8 },
    ]
    localStorage.setItem("cart", JSON.stringify(cart))
  }

  renderCart()
  updateCartSummary()
}

// Render cart items
function renderCart() {
  const cartTableBody = document.getElementById("cartTableBody")
  const emptyCartMessage = document.getElementById("emptyCartMessage")
  const cartSummarySection = document.getElementById("cartSummarySection")

  if (cart.length === 0) {
    cartTableBody.innerHTML = ""
    emptyCartMessage.classList.remove("hidden")
    cartSummarySection.classList.add("hidden")
    return
  }

  emptyCartMessage.classList.add("hidden")
  cartSummarySection.classList.remove("hidden")

  cartTableBody.innerHTML = cart
    .map((product, index) => {
      const total = (Number(product.price) * Number(product.quantity)).toFixed(2)
      return `
            <tr class="hover:bg-orange-50 transition-colors duration-200">
                <td class="py-4 px-6">
                    <div class="flex items-center space-x-3">
                        <div class="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-lg flex items-center justify-center">
                            <i class="fas fa-cubes text-white text-lg"></i>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-900">${product.name}</p>
                            <p class="text-sm text-gray-500">Agregado de construcción</p>
                        </div>
                    </div>
                </td>
                <td class="py-4 px-6 text-center">
                    <div class="flex items-center justify-center space-x-2">
                        <button onclick="updateQuantity('${product.id}', ${product.quantity - 1})" 
                                class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors duration-200"
                                ${product.quantity <= 1 ? "disabled" : ""}>
                            <i class="fas fa-minus text-xs"></i>
                        </button>
                        <input type="number" 
                               min="1" 
                               value="${product.quantity}" 
                               onchange="updateQuantity('${product.id}', this.value)"
                               oninput="this.value = this.value.replace(/[^0-9]/g, '')"
                               class="w-16 text-center border border-gray-300 rounded-lg py-1 focus:border-brand-orange focus:outline-none">
                        <button onclick="updateQuantity('${product.id}', ${product.quantity + 1})" 
                                class="w-8 h-8 bg-gray-200 hover:bg-gray-300 rounded-full flex items-center justify-center transition-colors duration-200">
                            <i class="fas fa-plus text-xs"></i>
                        </button>
                    </div>
                    <p class="text-xs text-gray-500 mt-1">${product.quantity} m³</p>
                </td>
                <td class="py-4 px-6 text-center">
                    <span class="font-semibold text-gray-900">S/ ${Number(product.price).toFixed(2)}</span>
                    <p class="text-xs text-gray-500">por m³</p>
                </td>
                <td class="py-4 px-6 text-center">
                    <span class="font-bold text-brand-orange text-lg">S/ ${total}</span>
                </td>
                <td class="py-4 px-6 text-center">
                    <button onclick="removeFromCart('${product.id}')" 
                            class="inline-flex items-center px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200">
                        <i class="fas fa-trash-alt mr-1"></i>
                        Eliminar
                    </button>
                </td>
            </tr>
        `
    })
    .join("")
}

// Update quantity
function updateQuantity(id, quantity) {
  const parsedQuantity = Number.parseInt(quantity, 10)
  if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
    showNotification("Por favor, ingrese un número válido mayor a 0.", "error")
    loadCart()
    return
  }

  const productIndex = cart.findIndex((item) => item.id === id)
  if (productIndex !== -1) {
    cart[productIndex].quantity = parsedQuantity
    localStorage.setItem("cart", JSON.stringify(cart))
    renderCart()
    updateCartSummary()
    showNotification("Cantidad actualizada correctamente", "success")
  }
}

// Remove from cart
function removeFromCart(id) {
  const productIndex = cart.findIndex((item) => item.id === id)
  if (productIndex !== -1) {
    const productName = cart[productIndex].name
    cart.splice(productIndex, 1)
    localStorage.setItem("cart", JSON.stringify(cart))
    renderCart()
    updateCartSummary()
    showNotification(`${productName} eliminado del carrito`, "success")
  }
}

// Update cart summary
function updateCartSummary() {
  const totalPrice = cart.reduce((sum, product) => sum + product.price * product.quantity, 0)
  const summaryElement = document.getElementById("cartSummary")
  if (summaryElement) {
    summaryElement.textContent = `S/ ${totalPrice.toFixed(2)}`
  }
}

// Add more products
function addMoreProducts() {
  window.location.href = "agregados.html"
}

// Generate WhatsApp quote
function generateWhatsAppQuote() {
  if (cart.length === 0) {
    showNotification("Tu carrito está vacío. Agrega productos antes de generar la cotización.", "warning")
    return
  }

  const clientName = document.getElementById("clientName").value || "Cliente"
  const documentNumber = document.getElementById("documentNumber").value || "No especificado"
  const phoneNumber = document.getElementById("phoneNumber").value || "No especificado"
  const totalPrice = cart.reduce((sum, product) => sum + product.price * product.quantity, 0)
  const documentLabel = currentDocumentType === "ruc" ? "RUC" : "DNI"

  let message = `🏗️ *COTIZACIÓN - H&C FerroMateriales*\n\n`
  message += `👤 *Cliente:* ${clientName}\n`
  message += `📄 *${documentLabel}:* ${documentNumber}\n`
  message += `📱 *Teléfono:* ${phoneValidation && phoneValidation.isValid ? phoneValidation.internationalNumber : phoneNumber}\n`
  message += `📅 *Fecha:* ${new Date().toLocaleDateString("es-ES")}\n\n`
  message += `📦 *PRODUCTOS SOLICITADOS:*\n`

  cart.forEach((product, index) => {
    const itemTotal = product.price * product.quantity
    message += `${index + 1}. ${product.name}\n`
    message += `   • Cantidad: ${product.quantity} m³\n`
    message += `   • Precio: S/ ${product.price.toFixed(2)} por m³\n`
    message += `   • Subtotal: S/ ${itemTotal.toFixed(2)}\n\n`
  })

  message += `💰 *TOTAL: S/ ${totalPrice.toFixed(2)}*\n\n`
  message += `📋 *Condiciones:*\n`
  message += `• Pedido mínimo: 10 m³\n`
  message += `• Precios no incluyen IGV\n`
  message += `• Entrega en 24-48 horas\n`
  message += `• Pago: Efectivo o transferencia\n\n`
  message += `¿Desea proceder con este pedido?`

  const whatsappUrl = `https://wa.me/971164073?text=${encodeURIComponent(message)}`
  window.open(whatsappUrl, "_blank")
}

// Generate PDF
function generatePDF() {
  if (cart.length === 0) {
    showNotification("Tu carrito está vacío. Agrega productos antes de generar el PDF.", "warning")
    return
  }

  showLoading(true)

  try {
    const { jsPDF } = window.jspdf
    const doc = new jsPDF()

    const documentNumber = document.getElementById("documentNumber").value || "No especificado"
    const clientName = document.getElementById("clientName").value || "Cliente"
    const phoneNumber = document.getElementById("phoneNumber").value || "No especificado"
    const totalPrice = cart.reduce((sum, product) => sum + product.price * product.quantity, 0)
    const documentLabel = currentDocumentType === "ruc" ? "RUC" : "DNI"

    // Company information
    doc.setFontSize(10)
    doc.text("RUC: 20600134648 | H & C FERROMATERIALES S.R.L.", 10, 20)
    doc.text("Agregados de construcción", 10, 28)
    doc.text("hcferromaterialessrl@hotmail.com", 10, 36)
    doc.text("Pomalca, Chiclayo, Lambayeque", 10, 44)
    doc.text("Tel: +51 971 164 073 | +51 903 511 797", 10, 52)

    // Title
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text("COTIZACIÓN", 120, 30)

    // Quote information
    doc.setFontSize(10)
    doc.setFont("helvetica", "normal")
    doc.text(
      "Fecha: " +
        new Date().toLocaleDateString("es-ES", {
          year: "numeric",
          month: "long",
          day: "numeric",
        }),
      120,
      55,
    )
    doc.text(`${documentLabel}: ${documentNumber}`, 120, 63)
    doc.text("Cliente: " + clientName, 120, 71)
    doc.text(
      "Teléfono: " + (phoneValidation && phoneValidation.isValid ? phoneValidation.internationalNumber : phoneNumber),
      120,
      79,
    )
    doc.text("Cotización N°: " + Date.now().toString().slice(-6), 120, 87)

    // Products table
    doc.autoTable({
      startY: 100,
      head: [["#", "Descripción", "Precio Unitario", "Cantidad", "SubTotal"]],
      body: cart.map((product, index) => [
        index + 1,
        product.name,
        `S/ ${product.price.toFixed(2)}`,
        `${product.quantity} m³`,
        `S/ ${(product.price * product.quantity).toFixed(2)}`,
      ]),
      styles: {
        fontSize: 11,
        cellPadding: 5,
      },
      headStyles: {
        fillColor: [255, 140, 0],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      alternateRowStyles: {
        fillColor: [255, 248, 240],
      },
    })

    // Total
    doc.setFontSize(14)
    doc.setFont("helvetica", "bold")
    doc.text(`TOTAL: S/ ${totalPrice.toFixed(2)}`, 10, doc.autoTable.previous.finalY + 15)

    // Notes
    doc.setFontSize(11)
    doc.setFont("helvetica", "normal")
    doc.text("Notas importantes:", 10, doc.autoTable.previous.finalY + 30)

    doc.setFontSize(10)
    const notes = [
      "• Los precios de esta cotización no incluyen IGV.",
      "• Pedido mínimo: 10 m³ por producto.",
      "• Entrega en 24-48 horas según disponibilidad.",
      "• Los precios pueden variar según la cantidad requerida.",
      "• Validez de la cotización: 7 días calendario.",
      "• Forma de pago: Efectivo o transferencia bancaria.",
    ]

    notes.forEach((note, index) => {
      doc.text(note, 10, doc.autoTable.previous.finalY + 36 + index * 6)
    })

    // Footer
    const pageHeight = doc.internal.pageSize.height
    const footerText = "www.hycferromateriales.com"
    const textWidth = doc.getTextWidth(footerText)
    const xPosition = (doc.internal.pageSize.width - textWidth) / 2
    doc.setFontSize(10)
    doc.text(footerText, xPosition, pageHeight - 10)

    // Save PDF
    const fileName = `cotizacion_${clientName.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`
    doc.save(fileName)

    showNotification("PDF generado correctamente", "success")
  } catch (error) {
    console.error("Error generating PDF:", error)
    showNotification("Error al generar el PDF. Por favor, inténtalo de nuevo.", "error")
  } finally {
    showLoading(false)
  }
}

// Show loading overlay
function showLoading(show) {
  const overlay = document.getElementById("loadingOverlay")
  if (show) {
    overlay.classList.remove("hidden")
  } else {
    overlay.classList.add("hidden")
  }
}

// Show notification
function showNotification(message, type = "info") {
  const container = document.getElementById("notificationContainer")
  const notification = document.createElement("div")

  const colors = {
    success: "from-green-500 to-green-600",
    error: "from-red-500 to-red-600",
    warning: "from-yellow-500 to-yellow-600",
    info: "from-blue-500 to-blue-600",
  }

  const icons = {
    success: "fa-check-circle",
    error: "fa-times-circle",
    warning: "fa-exclamation-triangle",
    info: "fa-info-circle",
  }

  notification.className = `bg-gradient-to-r ${colors[type]} text-white px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 animate-slide-up`
  notification.innerHTML = `
        <div class="flex items-center">
            <i class="fas ${icons[type]} mr-3 text-xl"></i>
            <span class="font-medium">${message}</span>
        </div>
    `

  container.appendChild(notification)

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.style.transform = "translateX(400px)"
    notification.style.opacity = "0"
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification)
      }
    }, 300)
  }, 5000)
}

// Add keyboard shortcuts
document.addEventListener("keydown", (e) => {
  // Ctrl + Enter to generate PDF
  if (e.ctrlKey && e.key === "Enter") {
    e.preventDefault()
    generatePDF()
  }
  // Escape to clear notifications
  if (e.key === "Escape") {
    const notifications = document.querySelectorAll("#notificationContainer > div")
    notifications.forEach((notification) => {
      notification.style.transform = "translateX(400px)"
      notification.style.opacity = "0"
    })
  }
})

console.log("🛒 Carrito de H&C FerroMateriales cargado correctamente!")
