#![cfg(test)]
use super::*;
use soroban_sdk::{testutils::Address as _, Address, Env, String};

#[test]
fn test_full_flow() {
    let env = Env::default();
    env.mock_all_auths();

    let contract_id = env.register_contract(None, IjazahContract);
    let client = IjazahContractClient::new(&env, &contract_id);

    let admin = Address::generate(&env);
    let institution = Address::generate(&env);
    let recipient = Address::generate(&env);

    // 1. Init
    client.initialize(&admin);

    // 2. Daftarkan institusi
    client.register_institution(&admin, &institution);
    assert!(client.is_institution(&institution));

    // 3. Terbitkan ijazah
    let cert_id = client.issue_certificate(
        &institution,
        &recipient,
        &String::from_str(&env, "Budi Santoso"),
        &String::from_str(&env, "S.Kom - Teknik Informatika"),
        &String::from_str(&env, "Universitas Nusantara"),
    );

    // 4. Verifikasi
    let cert = client.verify_certificate(&cert_id);
    assert_eq!(cert.is_revoked, false);
    assert_eq!(cert.name, String::from_str(&env, "Budi Santoso"));

    // 5. Cek by owner
    let certs = client.get_certificates_by_owner(&recipient);
    assert_eq!(certs.len(), 1);

    // 6. Revoke
    client.revoke_certificate(&institution, &cert_id);
    let cert = client.verify_certificate(&cert_id);
    assert!(cert.is_revoked);
}