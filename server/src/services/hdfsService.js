// CloudHive — HDFS storage service (Module 7)
// All HDFS/WebHDFS communication is isolated in this service layer.
// Uses WebHDFS REST API against the NameNode (no Java/native client required).

const NAMENODE_HOST = process.env.NAMENODE_HOST || "localhost";
const WEBHDFS_PORT = process.env.WEBHDFS_PORT || 9870;
const HDFS_BASE_PATH = process.env.HDFS_BASE_PATH || "/cloudhive";

const WEBHDFS_BASE = `http://${NAMENODE_HOST}:${WEBHDFS_PORT}/webhdfs/v1`;

// Write a readable stream to HDFS (two-step WebHDFS: redirect to DataNode, then PUT data)
async function writeFile(hdfsPath, readStream) {
  const createUrl =
    `${WEBHDFS_BASE}${hdfsPath}?op=CREATE` +
    `&overwrite=true&noredirect=false`;

  const res = await fetch(createUrl, { method: "PUT", redirect: "manual" });

  // WebHDFS answers CREATE with 307 pointing at the DataNode
  const dataNodeUrl = res.headers.get("location");
  if (!dataNodeUrl) {
    throw new Error(`WebHDFS CREATE failed (${res.status}): no redirect location`);
  }

  const putRes = await fetch(dataNodeUrl, {
    method: "PUT",
    body: readStream,
    duplex: "half", // required by undici for streaming request bodies
  });
  if (!putRes.ok) {
    const body = await putRes.text();
    throw new Error(`WebHDFS upload failed (${putRes.status}): ${body}`);
  }
  return true;
}

// Read a file from HDFS, returning a Web ReadableStream of the body
async function readFile(hdfsPath) {
  const openUrl = `${WEBHDFS_BASE}${hdfsPath}?op=OPEN`;
  const res = await fetch(openUrl);
  if (!res.ok) {
    throw new Error(`WebHDFS OPEN failed (${res.status}) for ${hdfsPath}`);
  }
  return res.body; // web ReadableStream; pipe via Readable.fromWeb() in routes
}

// Delete a file/directory on HDFS
async function deleteFile(hdfsPath) {
  const res = await fetch(
    `${WEBHDFS_BASE}${hdfsPath}?op=DELETE&recursive=true`,
    { method: "DELETE" }
  );
  if (!res.ok) {
    throw new Error(`WebHDFS DELETE failed (${res.status}) for ${hdfsPath}`);
  }
  const json = await res.json();
  return json.boolean === true;
}

// List a directory
async function listStatus(hdfsPath) {
  const res = await fetch(`${WEBHDFS_BASE}${hdfsPath}?op=LISTSTATUS`);
  if (!res.ok) {
    throw new Error(`WebHDFS LISTSTATUS failed (${res.status}) for ${hdfsPath}`);
  }
  const json = await res.json();
  return json.FileStatuses.FileStatus;
}

// Build the HDFS path for an uploaded file:
// /cloudhive/{user_id}/{folder}/{uuid}_{filename}
function buildHdfsPath(userId, folderPath, fileName) {
  const cleanFolder = (folderPath || "/").replace(/\/+$/, "");
  const safeName = fileName.replace(/[\/\\]/g, "_");
  const { randomUUID } = require("crypto");
  return `${HDFS_BASE_PATH}/${userId}${cleanFolder}/${randomUUID()}_${safeName}`;
}

module.exports = {
  writeFile,
  readFile,
  deleteFile,
  listStatus,
  buildHdfsPath,
  WEBHDFS_BASE,
};
