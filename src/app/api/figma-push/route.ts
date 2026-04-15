import { NextRequest, NextResponse } from "next/server";
import type { ResolvedDesign } from "@/lib/types";

function hexToFigmaColor(hex: string): { r: number; g: number; b: number; a: number } {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
    a: 1,
  };
}

export async function POST(req: NextRequest) {
  const { token, fileKey, resolved } = (await req.json()) as {
    token: string;
    fileKey: string;
    resolved: ResolvedDesign;
  };

  if (!token || !fileKey || !resolved) {
    return NextResponse.json({ error: "Missing token, fileKey, or resolved design" }, { status: 400 });
  }

  try {
    // Step 1: Get existing variable collections
    const existingRes = await fetch(
      `https://api.figma.com/v1/files/${fileKey}/variables/local`,
      { headers: { "X-Figma-Token": token } }
    );

    if (!existingRes.ok) {
      const err = await existingRes.text();
      return NextResponse.json({ error: `Figma API error: ${err}` }, { status: existingRes.status });
    }

    const existing = await existingRes.json();

    // Check if we already have a Ditto collection
    let collectionId: string | null = null;
    let modeId: string | null = null;

    const collections = existing.meta?.variableCollections || {};
    for (const [id, coll] of Object.entries(collections) as [string, { name: string; modes: Array<{ modeId: string }> }][]) {
      if (coll.name === "Ditto Tokens") {
        collectionId = id;
        modeId = coll.modes[0]?.modeId || null;
        break;
      }
    }

    // Build the variables payload
    const colorVars: Array<{
      name: string;
      resolvedType: string;
      value: { r: number; g: number; b: number; a: number };
    }> = [
      { name: "color/primary", resolvedType: "COLOR", value: hexToFigmaColor(resolved.colorPrimary) },
      { name: "color/secondary", resolvedType: "COLOR", value: hexToFigmaColor(resolved.colorSecondary) },
      { name: "color/accent", resolvedType: "COLOR", value: hexToFigmaColor(resolved.colorAccent) },
      { name: "color/background", resolvedType: "COLOR", value: hexToFigmaColor(resolved.colorBackground) },
      { name: "color/surface", resolvedType: "COLOR", value: hexToFigmaColor(resolved.colorSurface) },
      { name: "color/text", resolvedType: "COLOR", value: hexToFigmaColor(resolved.colorTextPrimary) },
      { name: "color/text-secondary", resolvedType: "COLOR", value: hexToFigmaColor(resolved.colorTextSecondary) },
      { name: "color/text-muted", resolvedType: "COLOR", value: hexToFigmaColor(resolved.colorTextMuted) },
      { name: "color/border", resolvedType: "COLOR", value: hexToFigmaColor(resolved.colorBorder) },
      { name: "color/success", resolvedType: "COLOR", value: hexToFigmaColor(resolved.colorSuccess) },
      { name: "color/warning", resolvedType: "COLOR", value: hexToFigmaColor(resolved.colorWarning) },
      { name: "color/error", resolvedType: "COLOR", value: hexToFigmaColor(resolved.colorError) },
    ];

    const floatVars: Array<{ name: string; resolvedType: string; value: number }> = [
      { name: "space/xs", resolvedType: "FLOAT", value: parseFloat(resolved.spacingXs) },
      { name: "space/sm", resolvedType: "FLOAT", value: parseFloat(resolved.spacingSm) },
      { name: "space/md", resolvedType: "FLOAT", value: parseFloat(resolved.spacingMd) },
      { name: "space/lg", resolvedType: "FLOAT", value: parseFloat(resolved.spacingLg) },
      { name: "space/xl", resolvedType: "FLOAT", value: parseFloat(resolved.spacingXl) },
      { name: "space/2xl", resolvedType: "FLOAT", value: parseFloat(resolved.spacing2xl) },
      { name: "radius/sm", resolvedType: "FLOAT", value: parseFloat(resolved.radiusSm) },
      { name: "radius/md", resolvedType: "FLOAT", value: parseFloat(resolved.radiusMd) },
      { name: "radius/lg", resolvedType: "FLOAT", value: parseFloat(resolved.radiusLg) },
    ];

    // Build the POST body for Figma Variables API
    const variableActions: Array<Record<string, unknown>> = [];
    const variableModeValues: Array<Record<string, unknown>> = [];

    if (!collectionId) {
      // Create collection
      const tempId = "ditto_collection";
      variableActions.push({
        action: "CREATE",
        id: tempId,
        name: "Ditto Tokens",
        initialMode: { name: "Default" },
      });

      // Create variables
      for (const v of [...colorVars, ...floatVars]) {
        const varTempId = `var_${v.name.replace(/\//g, "_")}`;
        variableActions.push({
          action: "CREATE",
          id: varTempId,
          name: v.name,
          resolvedType: v.resolvedType,
          variableCollectionId: tempId,
        });
        variableModeValues.push({
          action: "CREATE",
          variableId: varTempId,
          modeId: `${tempId}_mode_0`,
          value: v.value,
        });
      }
    } else {
      // Update existing variables
      const existingVars = existing.meta?.variables || {};
      const existingVarMap = new Map<string, string>();
      for (const [id, v] of Object.entries(existingVars) as [string, { name: string }][]) {
        existingVarMap.set(v.name, id);
      }

      for (const v of [...colorVars, ...floatVars]) {
        const existingId = existingVarMap.get(v.name);
        if (existingId) {
          // Update value
          variableModeValues.push({
            action: "UPDATE",
            variableId: existingId,
            modeId: modeId!,
            value: v.value,
          });
        } else {
          // Create new variable
          const varTempId = `var_${v.name.replace(/\//g, "_")}`;
          variableActions.push({
            action: "CREATE",
            id: varTempId,
            name: v.name,
            resolvedType: v.resolvedType,
            variableCollectionId: collectionId,
          });
          variableModeValues.push({
            action: "CREATE",
            variableId: varTempId,
            modeId: modeId!,
            value: v.value,
          });
        }
      }
    }

    const body: Record<string, unknown[]> = {};
    if (variableActions.length > 0) {
      // Separate collection creates from variable creates
      const collectionCreates = variableActions.filter((a) => a.initialMode);
      const varCreates = variableActions.filter((a) => !a.initialMode);
      if (collectionCreates.length > 0) body.variableCollections = collectionCreates;
      if (varCreates.length > 0) body.variables = varCreates;
    }
    if (variableModeValues.length > 0) {
      body.variableModeValues = variableModeValues;
    }

    // Push to Figma
    const pushRes = await fetch(
      `https://api.figma.com/v1/files/${fileKey}/variables`,
      {
        method: "POST",
        headers: {
          "X-Figma-Token": token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    if (!pushRes.ok) {
      const err = await pushRes.text();
      return NextResponse.json({ error: `Push failed: ${err}` }, { status: pushRes.status });
    }

    await pushRes.json();
    const totalVars = colorVars.length + floatVars.length;

    return NextResponse.json({
      success: true,
      message: `Pushed ${totalVars} variables to Figma`,
      totalVars,
      isUpdate: !!collectionId,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
