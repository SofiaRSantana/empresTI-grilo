import type { PrismaClient } from "@prisma/client";
import { getSupabaseConfiguration } from "@/src/server/env";
import { equipmentPhotoBucket } from "@/src/shared/catalog-settings.mjs";

export async function listEquipment(db: PrismaClient, tenantId: string) {
  const equipment = await db.equipment.findMany({
    where: { tenantId },
    orderBy: { patrimonyCode: "asc" },
    select: {
      id: true,
      name: true,
      category: true,
      status: true,
      location: true,
      patrimonyCode: true,
      imagePath: true,
    },
  });
  const { url } = getSupabaseConfiguration();
  return equipment.map(({ imagePath, ...item }) => {
    const encodedPath = imagePath?.split("/").map(encodeURIComponent).join("/");
    return {
      ...item,
      imageUrl: encodedPath ? new URL(`/storage/v1/object/public/${equipmentPhotoBucket}/${encodedPath}`, url).href : null,
    };
  });
}
