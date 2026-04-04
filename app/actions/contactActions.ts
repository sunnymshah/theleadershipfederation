"use server"

/**
 * Server Action: submitContactInquiry
 *
 * Receives form data from the ContactForm client component and inserts it
 * into the Supabase `leads` table.
 *
 * TODO: Wire up actual Supabase insert once the `leads` table schema is
 * finalized. For now, logs the data and returns success.
 */

export async function submitContactInquiry(formData: FormData) {
  const payload = {
    full_name: formData.get("full_name") as string,
    email: formData.get("email") as string,
    phone: (formData.get("phone") as string) || null,
    company: (formData.get("company") as string) || null,
    designation: (formData.get("designation") as string) || null,
    inquiry_type: formData.get("inquiry_type") as string,
    message: formData.get("message") as string,
    source_page: (formData.get("source_page") as string) || "contact",
    created_at: new Date().toISOString(),
  }

  // Basic validation
  if (!payload.full_name || !payload.email || !payload.inquiry_type || !payload.message) {
    return { success: false, error: "Please fill in all required fields." }
  }

  try {
    // TODO: Replace with Supabase insert
    // const cookieStore = await cookies()
    // const supabase = createClient(cookieStore)
    // const { error } = await supabase.from("leads").insert(payload)
    // if (error) throw error

    console.log("[Contact Inquiry]", JSON.stringify(payload, null, 2))
    return { success: true }
  } catch (err) {
    console.error("[Contact Inquiry] Failed:", err)
    return { success: false, error: "An unexpected error occurred. Please try again." }
  }
}
