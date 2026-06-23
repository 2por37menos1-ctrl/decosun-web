import { supabase } from "./supabase";

const ticket = "9967EAAD-5A0B-4333-A576-692A53C3053E";

function formatDate(date = new Date()) {
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();

    return `${day}${month}${year}`;
}

function daysLeft(fechaCierre) {
    if (!fechaCierre) return null;

    const cierre = new Date(fechaCierre);
    const hoy = new Date();

    return Math.ceil(
        (cierre.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24)
    );
}

function normalizeText(text = "") {
    return text
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function getDatesBack(days = 14) {
    const dates = [];

    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);

        dates.push(date);
    }

    return dates;
}

export async function testMercadoPublico() {
    const dates = getDatesBack(5);

    let listadoCompleto = [];

    for (const date of dates) {
        const fecha = formatDate(date);

        const url =
            `https://api.mercadopublico.cl/servicios/v1/publico/licitaciones.json?fecha=${fecha}&ticket=${ticket}`;

        console.log("Consultando fecha:", fecha);

        const response = await fetch(url);

        if (!response.ok) {
            console.warn(
                "No se pudo consultar:",
                fecha,
                response.status
            );
            continue;
        }

        const data = await response.json();

        listadoCompleto = [
            ...listadoCompleto,
            ...(data.Listado || [])
        ];

        await new Promise((resolve) =>
            setTimeout(resolve, 1500)
        );
    }

    const listado = listadoCompleto;

    console.log(
        "Licitaciones descargadas:",
        listado.length
    );

    const { data: keywordsData, error: keywordsError } = await supabase
        .from("market_keywords")
        .select("keyword, priority")
        .eq("is_active", true);

    if (keywordsError) {
        console.error("Error cargando keywords:", keywordsError);
        return { ok: false, error: keywordsError };
    }

    const keywords = keywordsData || [];

    console.log("Keywords activas:", keywords.length);

    const oportunidades = listado
        .map((item) => {
            const texto = normalizeText(item.Nombre || "");

            const matchedKeywords = keywords
                .filter((k) => texto.includes(normalizeText(k.keyword)))
                .map((k) => k.keyword);

            if (matchedKeywords.length === 0) return null;

            return {
                source: "mercado_publico",
                external_id: item.CodigoExterno,
                title: item.Nombre,
                status: String(item.CodigoEstado || ""),
                closing_at: item.FechaCierre || null,
                days_left: daysLeft(item.FechaCierre),
                matched_keywords: matchedKeywords,
                raw_data: item,
                review_status: "nueva",
                priority: matchedKeywords.some((k) =>
                    ["roller", "blackout", "screen", "cortinas roller"].includes(
                        normalizeText(k)
                    )
                )
                    ? "alta"
                    : "media",
                updated_at: new Date().toISOString(),
            };
        })
        .filter(Boolean);

    console.log("Oportunidades a guardar:", oportunidades.length);
    console.log(oportunidades);

    if (oportunidades.length === 0) {
        return {
            ok: true,
            inserted: 0,
            message: "Sin oportunidades detectadas.",
        };
    }

    const { data: saved, error } = await supabase
        .from("market_opportunities")
        .upsert(oportunidades, {
            onConflict: "external_id",
        })
        .select();

    if (error) {
        console.error("Error guardando oportunidades:", error);
        return { ok: false, error };
    }

    console.log("Guardado en Supabase:", saved);

    return {
        ok: true,
        inserted: saved.length,
        data: saved,
    };
}