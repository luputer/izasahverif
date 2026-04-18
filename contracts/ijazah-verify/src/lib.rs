#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype,
    symbol_short, Env, String, Symbol,
    Vec, Address, Map,
};

#[contracttype]
#[derive(Clone, Debug)]
pub struct Certificate {
    pub id:           u64,
    pub recipient:    Address,
    pub name:         String,
    pub degree:       String,
    pub institution:  String,
    pub issued_at:    u64,
    pub is_revoked:   bool,
}

const CERTS: Symbol = symbol_short!("CERTS");
const INSTS: Symbol = symbol_short!("INSTS");
const OWNER: Symbol = symbol_short!("OWNER");
const ADMIN: Symbol = symbol_short!("ADMIN");

#[contract]
pub struct IjazahContract;

#[contractimpl]
impl IjazahContract {

    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&ADMIN) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&ADMIN, &admin);

        // Automatically authorize the admin as the first institution
        let mut insts: Map<Address, bool> = Map::new(&env);
        insts.set(admin, true);
        env.storage().instance().set(&INSTS, &insts);

        env.storage().instance().set(&CERTS, &Map::<u64, Certificate>::new(&env));
        env.storage().instance().set(&OWNER, &Map::<Address, Vec<u64>>::new(&env));
    }

    pub fn register_institution(env: Env, caller: Address, institution: Address) {
        caller.require_auth();
        let admin: Address = env.storage().instance().get(&ADMIN).unwrap();
        if caller != admin {
            panic!("Only admin");
        }
        let mut insts: Map<Address, bool> = env
            .storage().instance().get(&INSTS)
            .unwrap_or(Map::new(&env));
        insts.set(institution, true);
        env.storage().instance().set(&INSTS, &insts);
    }

    pub fn issue_certificate(
        env: Env,
        caller:      Address,
        recipient:   Address,
        name:        String,
        degree:      String,
        institution: String,
    ) -> u64 {
        caller.require_auth();
        let insts: Map<Address, bool> = env
            .storage().instance().get(&INSTS)
            .unwrap_or(Map::new(&env));
        if !insts.get(caller.clone()).unwrap_or(false) {
            panic!("Not authorized institution");
        }
        let cert_id = env.prng().gen::<u64>();
        let cert = Certificate {
            id:         cert_id,
            recipient:  recipient.clone(),
            name,
            degree,
            institution,
            issued_at:  env.ledger().timestamp(),
            is_revoked: false,
        };
        let mut certs: Map<u64, Certificate> = env
            .storage().instance().get(&CERTS)
            .unwrap_or(Map::new(&env));
        certs.set(cert_id, cert);
        env.storage().instance().set(&CERTS, &certs);

        let mut owner_map: Map<Address, Vec<u64>> = env
            .storage().instance().get(&OWNER)
            .unwrap_or(Map::new(&env));
        let mut ids = owner_map.get(recipient.clone()).unwrap_or(Vec::new(&env));
        ids.push_back(cert_id);
        owner_map.set(recipient, ids);
        env.storage().instance().set(&OWNER, &owner_map);
        cert_id
    }

    pub fn revoke_certificate(env: Env, caller: Address, cert_id: u64) {
        caller.require_auth();
        let insts: Map<Address, bool> = env
            .storage().instance().get(&INSTS)
            .unwrap_or(Map::new(&env));
        if !insts.get(caller).unwrap_or(false) {
            panic!("Not authorized institution");
        }
        let mut certs: Map<u64, Certificate> = env
            .storage().instance().get(&CERTS)
            .unwrap_or(Map::new(&env));
        let mut cert = certs.get(cert_id).expect("Certificate not found");
        cert.is_revoked = true;
        certs.set(cert_id, cert);
        env.storage().instance().set(&CERTS, &certs);
    }

    pub fn verify_certificate(env: Env, cert_id: u64) -> Certificate {
        let certs: Map<u64, Certificate> = env
            .storage().instance().get(&CERTS)
            .unwrap_or(Map::new(&env));
        certs.get(cert_id).expect("Certificate not found")
    }

    pub fn get_certificates_by_owner(env: Env, owner: Address) -> Vec<Certificate> {
        let owner_map: Map<Address, Vec<u64>> = env
            .storage().instance().get(&OWNER)
            .unwrap_or(Map::new(&env));
        let ids = owner_map.get(owner).unwrap_or(Vec::new(&env));
        let certs: Map<u64, Certificate> = env
            .storage().instance().get(&CERTS)
            .unwrap_or(Map::new(&env));
        let mut result = Vec::new(&env);
        for i in 0..ids.len() {
            let id = ids.get(i).unwrap();
            if let Some(cert) = certs.get(id) {
                result.push_back(cert);
            }
        }
        result
    }

    pub fn is_institution(env: Env, address: Address) -> bool {
        let insts: Map<Address, bool> = env
            .storage().instance().get(&INSTS)
            .unwrap_or(Map::new(&env));
        insts.get(address).unwrap_or(false)
    }

    pub fn get_admin(env: Env) -> Address {
        env.storage().instance().get(&ADMIN).unwrap()
    }
}

mod test;
