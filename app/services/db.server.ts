import { PrismaClient } from "@prisma/client";
import { singleton } from "./singleton.server";
//import type { d } from "@prisma/client"
const db = singleton("prisma", () => new PrismaClient());
db.$connect();

export { db };

type User = {
  name: string;
  email: string;
  username: string;
  picture?: string;
};

type Comment = {
  postsId: string;
  userId: string;
  text: string;
  parentId?: string;
};

type Picture = {
  url: string;
};
type Post = {
  userId: string;
  markdown?: boolean;
  draft?: boolean;
  content?: string;
  picture?: Picture[];
};
// User
export async function findOrCreateUser(user: User) {
  return await db.user.upsert({
    where: {
      email: user.email,
    },
    update: {},
    create: {
      email: user.email,
      name: user.name,
      userName: user.username,
      picture: user.picture,
    },
  });
}

export async function getUserById(id: string) {
  return await db.user.findUnique({ where: { id: id } });
}

// Post
export async function createPost(data: Post) {
  if (!data.content || !data.picture) {
    throw "Minimal harus ada 1";
  }
  const picture = data.picture;
  return await db.post.create({
    data: {
      userId: data.userId,
      content: data.content,
      markdown: data.markdown,
      draft: data.draft,
      Picture: {
        create: [...picture],
      },
    },
    include: { Picture: true },
  });
}
export async function getAllPost() {
  return await db.post.findMany({
    include: {
      author: { select: { name: true, userName: true, picture: true } },
      _count: { select: { Comment: true, Like: true } },
      Picture: true,
    },
  });
}
export async function getPostById(id: string) {
  return await db.post.findUnique({
    where: { id: id },
    include: {
      author: { select: { name: true, userName: true, picture: true } },
      _count: { select: { Like: true } },
    },
  });
}

// Comment
export async function getComment(postId: string) {
  return await db.comment.findMany({
    where: {
      parentId: null,
      postsId: postId,
    },
    include: {
      Children: {
        include: {
          Children: true,
        },
      },
    },
  });
}

export async function setComment(data: Comment) {
  return await db.comment.create({
    data: {
      postsId: data.postsId,
      userId: data.userId,
      text: data.text,
      parentId: data.parentId,
    },
    include: {
      Children: {
        include: {
          Children: true,
        },
      },
    },
  });
}
