import { Storage } from "@plasmohq/storage"

import { NotLoginError } from "~types/errors"
import type { TwitchConfig } from "~types/platform"
import type { Room } from "~types/Room"

const storage = new Storage({
  area: "sync"
})

interface TwitchResponse {
  data: {
    currentUser: {
      followedLiveUsers: {
        edges: Array<{
          node: {
            id: string
            login: string
            displayName: string
            profileImageURL: string
            stream: {
              id: string
              title: string
              viewersCount: number
              previewImageURL: string
              type: string
              game: {
                id: string
                name: string
                displayName: string
              }
            }
          }
        }>
      }
    }
  }
}

export async function twitchFetch(): Promise<Room[]> {
  const config = await storage.get<TwitchConfig>("twitch_config")
  if (!config?.authToken) {
    throw new NotLoginError(
      "twitch",
      "https://www.twitch.tv/login?source=kaibola_auth"
    )
  }

  const query = [
    {
      operationName: "FollowingLive_CurrentUser",
      variables: {
        imageWidth: 50,
        limit: 30,
        includeIsDJ: true
      },
      extensions: {
        persistedQuery: {
          version: 1,
          sha256Hash:
            "ecadcf350272dde399a63385cf888903d7fcd4c8fc6809a8469fe3753579d1c6"
        }
      }
    }
  ]

  try {
    const response = await fetch("https://gql.twitch.tv/gql", {
      method: "POST",
      headers: {
        Authorization: `OAuth ${config.authToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(query)
    })

    if (!response.ok) {
      if (response.status === 401) {
        throw new NotLoginError(
          "twitch",
          "https://twitch.tv/login?source=kaibola_auth"
        )
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = (await response.json()) as TwitchResponse[]
    return twitchFilter(data[0])
  } catch (error) {
    if (error instanceof NotLoginError) {
      throw error
    }
    console.error("获取Twitch数据失败:", error)
    return []
  }
}

function twitchFilter(data: TwitchResponse): Room[] {
  if (!data?.data?.currentUser?.followedLiveUsers?.edges) {
    return []
  }

  return data.data.currentUser.followedLiveUsers.edges
    .filter(({ node }) => node.stream?.type === "live")
    .map(({ node }) => ({
      roomId: `twitch_${node.id}`,
      roomName: node.stream.title,
      streamerName: node.displayName,
      cover: node.stream.previewImageURL,
      avatar: node.profileImageURL,
      isOpen: true,
      platform: "twitch",
      url: `https://www.twitch.tv/${node.login}`,
      areaName: node.stream.game.displayName,
      showTime: ""
    }))
}
