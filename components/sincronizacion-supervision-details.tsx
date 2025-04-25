// Modificar la función formatDate para manejar correctamente la zona horaria
import { format } from "date-fns"
import { es } from "date-fns/locale"

function formatDate(dateString: string) {
  try {
    // Crear la fecha asegurando que se interprete como UTC
    const date = new Date(dateString + "T00:00:00Z")
    return format(date, "dd 'de' MMMM 'de' yyyy", {
      locale: es,
      // No es necesario especificar timeZone aquí ya que format de date-fns
      // trabaja diferente, pero aseguramos que la fecha base sea correcta
    })
  } catch (error) {
    return dateString
  }
}
