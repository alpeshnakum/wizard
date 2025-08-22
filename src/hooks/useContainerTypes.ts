import { useState, useEffect } from "react";
import { fetchContainerTypes, fetchMaterialTypes } from "../lib/graphql/api";

export interface MaterialType {
  id: string;
  label: string;
  density: number;
}

export const useContainerTypes = () => {
  const [containerTypes, setContainerTypes] = useState<string[]>([]);
  const [materialTypes, setMaterialTypes] = useState<MaterialType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);

        const [containerTypesData, materialTypesData] = await Promise.all([
          fetchContainerTypes(),
          fetchMaterialTypes(),
        ]);

        setContainerTypes(containerTypesData);
        setMaterialTypes(materialTypesData);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load container types"
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const getMaterialDensity = (materialId: string): number => {
    const material = materialTypes.find((m) => m.id === materialId);
    return material?.density || 0.2; // Default density
  };

  const getMaterialLabel = (materialId: string): string => {
    const material = materialTypes.find((m) => m.id === materialId);
    return material?.label || "Unknown Material";
  };

  const refetch = async () => {
    try {
      setLoading(true);
      setError(null);

      const [containerTypesData, materialTypesData] = await Promise.all([
        fetchContainerTypes(),
        fetchMaterialTypes(),
      ]);

      setContainerTypes(containerTypesData);
      setMaterialTypes(materialTypesData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load container types"
      );
    } finally {
      setLoading(false);
    }
  };

  return {
    containerTypes,
    materialTypes,
    loading,
    error,
    getMaterialDensity,
    getMaterialLabel,
    refetch,
  };
};
