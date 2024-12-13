import { useQuery } from "@tanstack/react-query";
import { api } from "../api";

const getDirectory = async (path: string) => {
    console.log({ path });
    const response = await api.api.directory.$get({
        query: {
            path,
        },
    });

    if (!response.ok) {
        throw new Error("Failed to fetch directory contents");
    }
    const res = await response.json();

    console.log(res);

    return res;
    /**
     *
     * type of res :
      {
        files: string[];
        dirs: string[];
      }
     */
};

export type DirectoryResponse = Awaited<ReturnType<typeof getDirectory>>;

export const useDirectoryContents = (path: string) => {
    return useQuery({
        queryKey: ["directory", path],
        queryFn: () => getDirectory(path),
        enabled: !!path, // Only enable when we have a path
    });
};
