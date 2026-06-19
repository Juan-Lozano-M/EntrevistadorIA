import { useQuery } from "@tanstack/react-query";
import { getHistory, getResults } from "@/lib/api";

export const useHistory = () =>
  useQuery({ queryKey: ["history"], queryFn: getHistory });

export const useResults = (id: number) =>
  useQuery({ queryKey: ["results", id], queryFn: () => getResults(id) });
