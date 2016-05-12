module.exports = (subhs, signature) => {
    return subhs.filter(subh => subh.signature && subh.signature.equals(signature));
};
