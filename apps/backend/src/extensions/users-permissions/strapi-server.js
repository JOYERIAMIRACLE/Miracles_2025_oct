module.exports = (plugin) => {
  plugin.contentTypes.user.schema.attributes.foto = {
    type: "media",
    multiple: false,
    required: false,
    allowedTypes: ["images"],
  }
  return plugin
}
